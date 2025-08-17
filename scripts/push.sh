#!/bin/bash

# Automatic version bumping and push script for feojs library
# Analyzes git commits to determine appropriate version bump and pushes changes

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
MAGENTA='\033[0;35m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# Default options
DRY_RUN=false
FORCE=false

# Parse command line arguments
while [[ $# -gt 0 ]]; do
    case $1 in
        --dry-run|-d)
            DRY_RUN=true
            shift
            ;;
        --force|-f)
            FORCE=true
            shift
            ;;
        --help|-h)
            echo "Usage: $0 [--dry-run] [--force]"
            echo "  --dry-run, -d  : Preview changes without making them"
            echo "  --force, -f    : Skip confirmation prompts"
            exit 0
            ;;
        *)
            echo "Unknown option: $1"
            exit 1
            ;;
    esac
done

function log() {
    local color=$1
    local message=$2
    echo -e "${color}${message}${NC}"
}

function get_current_version() {
    node -p "require('./package.json').version"
}

function get_latest_tag() {
    git describe --tags --abbrev=0 2>/dev/null || echo ""
}

function get_commits_since_tag() {
    local tag=$1
    if [[ -n "$tag" ]]; then
        git log "${tag}..HEAD" --oneline
    else
        git log --oneline
    fi
}

function analyze_commits() {
    local commits="$1"
    local has_major=false
    local has_minor=false
    local has_patch=false
    
    while IFS= read -r commit; do
        [[ -z "$commit" ]] && continue
        
        local message=$(echo "$commit" | tr '[:upper:]' '[:lower:]')
        
        # Check for breaking changes (major version)
        if [[ $message =~ breaking\ change|breaking:|!: ]] || [[ $message =~ feat.*!: ]] || [[ $message =~ fix.*!: ]]; then
            has_major=true
            log $RED "  🔥 BREAKING: $commit"
        # Check for new features (minor version)
        elif [[ $message =~ ^[a-f0-9]+[[:space:]]+feat(\(.+\))?: ]]; then
            has_minor=true
            log $GREEN "  ✨ FEATURE: $commit"
        # Check for bug fixes (patch version)
        elif [[ $message =~ ^[a-f0-9]+[[:space:]]+fix(\(.+\))?: ]]; then
            has_patch=true
            log $YELLOW "  🐛 FIX: $commit"
        # Other conventional commits (patch version)
        elif [[ $message =~ ^[a-f0-9]+[[:space:]]+(chore|docs|style|refactor|perf|test)(\(.+\))?: ]]; then
            has_patch=true
            log $BLUE "  🔧 OTHER: $commit"
        else
            log $MAGENTA "  📝 NON-CONVENTIONAL: $commit"
            has_patch=true
        fi
    done <<< "$commits"
    
    # Determine version bump type
    if [[ $has_major == true ]]; then
        echo "major"
    elif [[ $has_minor == true ]]; then
        echo "minor"
    elif [[ $has_patch == true ]]; then
        echo "patch"
    else
        echo "none"
    fi
}

function get_next_version() {
    local current_version=$1
    local bump_type=$2
    
    if [[ $bump_type == "none" ]]; then
        echo $current_version
        return
    fi
    
    IFS='.' read -ra version_parts <<< "$current_version"
    local major=${version_parts[0]}
    local minor=${version_parts[1]}
    local patch=${version_parts[2]}
    
    case $bump_type in
        "major")
            ((major++))
            minor=0
            patch=0
            ;;
        "minor")
            ((minor++))
            patch=0
            ;;
        "patch")
            ((patch++))
            ;;
    esac
    
    echo "${major}.${minor}.${patch}"
}

function update_package_version() {
    local new_version=$1
    
    if [[ $DRY_RUN == true ]]; then
        log $CYAN "DRY RUN: Would update package.json version to $new_version"
        return
    fi
    
    # Use npm version to update package.json (it also creates a git commit and tag)
    npm version $new_version --no-git-tag-version
    
    log $GREEN "✅ Updated package.json version to $new_version"
}

function run_tests() {
    if [[ $DRY_RUN == true ]]; then
        log $CYAN "DRY RUN: Would run tests"
        return 0
    fi
    
    log $BLUE "🧪 Running tests..."
    npm test -- --run
    
    if [[ $? -ne 0 ]]; then
        log $RED "❌ Tests failed! Aborting."
        return 1
    fi
    
    log $GREEN "✅ Tests passed!"
    return 0
}

function build_project() {
    if [[ $DRY_RUN == true ]]; then
        log $CYAN "DRY RUN: Would build project"
        return 0
    fi
    
    log $BLUE "🔨 Building project..."
    npm run build
    
    if [[ $? -ne 0 ]]; then
        log $RED "❌ Build failed! Aborting."
        return 1
    fi
    
    log $GREEN "✅ Build completed!"
    return 0
}

function commit_and_tag() {
    local version=$1
    local bump_type=$2
    
    if [[ $DRY_RUN == true ]]; then
        log $CYAN "DRY RUN: Would commit and tag version $version"
        return
    fi
    
    # Add package.json changes
    git add package.json
    
    # Commit version bump
    local commit_message="${bump_type}: bump version to $version"
    git commit -m "$commit_message"
    
    # Create tag
    git tag -a "v$version" -m "Release v$version"
    
    log $GREEN "✅ Created commit and tag for v$version"
}

function push_changes() {
    if [[ $DRY_RUN == true ]]; then
        log $CYAN "DRY RUN: Would push changes and tags to origin"
        return
    fi
    
    # Push commits and tags
    git push origin main
    git push origin --tags
    
    log $GREEN "✅ Pushed changes and tags to origin"
}

function confirm_action() {
    local message=$1
    
    if [[ $FORCE == true ]] || [[ $DRY_RUN == true ]]; then
        return 0
    fi
    
    read -p "$message (y/N): " response
    [[ $response =~ ^[Yy]([Ee][Ss])?$ ]]
}

# Main script execution
main() {
    log $MAGENTA "🚀 Feojs Automatic Version Bump and Push Script"
    log $MAGENTA "================================================"
    
    if [[ $DRY_RUN == true ]]; then
        log $CYAN "🔍 DRY RUN MODE - No changes will be made"
    fi
    
    # Check if we're in a git repository
    if ! git status &>/dev/null; then
        log $RED "❌ Not in a git repository"
        exit 1
    fi
    
    # Check for uncommitted changes
    local status=$(git status --porcelain)
    if [[ -n "$status" ]] && [[ $DRY_RUN == false ]]; then
        log $YELLOW "⚠️ You have uncommitted changes:"
        echo "$status"
        if ! confirm_action "Continue anyway?"; then
            log $RED "Aborted by user"
            exit 1
        fi
    fi
    
    # Get current version
    local current_version=$(get_current_version)
    log $BLUE "📦 Current version: $current_version"
    
    # Get latest tag and commits since then
    local latest_tag=$(get_latest_tag)
    local commits
    if [[ -n "$latest_tag" ]]; then
        log $BLUE "🏷️ Latest tag: $latest_tag"
        commits=$(get_commits_since_tag "$latest_tag")
    else
        log $YELLOW "🏷️ No previous tags found, analyzing all commits"
        commits=$(get_commits_since_tag "")
    fi
    
    if [[ -z "$commits" ]]; then
        log $GREEN "✅ No new commits found. Nothing to do."
        exit 0
    fi
    
    log $BLUE "📝 Analyzing commits since last tag:"
    local bump_type=$(analyze_commits "$commits")
    
    if [[ $bump_type == "none" ]]; then
        log $GREEN "✅ No version bump needed."
        exit 0
    fi
    
    # Calculate new version
    local new_version=$(get_next_version "$current_version" "$bump_type")
    
    echo
    log $MAGENTA "📊 Version Analysis:"
    log $BLUE "  Current version: $current_version"
    log $YELLOW "  Bump type: $bump_type"
    log $GREEN "  New version: $new_version"
    
    # Confirm before proceeding
    if [[ $DRY_RUN == false ]] && ! confirm_action "Proceed with version bump to $new_version?"; then
        log $RED "Aborted by user"
        exit 1
    fi
    
    # Update package.json
    update_package_version "$new_version"
    
    # Run tests
    if ! run_tests; then
        exit 1
    fi
    
    # Build project
    if ! build_project; then
        exit 1
    fi
    
    # Commit and tag
    commit_and_tag "$new_version" "$bump_type"
    
    # Push changes
    push_changes
    
    echo
    log $GREEN "🎉 Successfully bumped version to $new_version and pushed changes!"
    log $BLUE "🔗 Repository: https://github.com/plinsy/feojs"
}

# Run main function
main "$@"

#!/usr/bin/env powershell

<#
.SYNOPSIS
    Automatic version bumping and push script for feojs library
.DESCRIPTION
    This script analyzes git commits since the last tag to determine the appropriate version bump
    based on conventional commit standards, updates package.json, builds the project, and pushes changes.
.PARAMETER DryRun
    Run the script without making any actual changes (preview mode)
.PARAMETER Force
    Skip confirmation prompts
.EXAMPLE
    .\scripts\push.ps1
    .\scripts\push.ps1 -DryRun
    .\scripts\push.ps1 -Force
#>

param(
    [switch]$DryRun = $false,
    [switch]$Force = $false
)

# Set error action preference
$ErrorActionPreference = "Stop"

# Colors for output
$Colors = @{
    Green = "Green"
    Yellow = "Yellow"
    Red = "Red"
    Blue = "Blue"
    Cyan = "Cyan"
    Magenta = "Magenta"
}

function Write-ColorOutput {
    param(
        [string]$Message,
        [string]$Color = "White"
    )
    Write-Host $Message -ForegroundColor $Color
}

function Get-CurrentVersion {
    $packageJson = Get-Content "package.json" | ConvertFrom-Json
    return $packageJson.version
}

function Get-LatestTag {
    try {
        $latestTag = git describe --tags --abbrev=0 2>$null
        if ($LASTEXITCODE -eq 0) {
            return $latestTag.Trim()
        }
    } catch {
        # No tags found
    }
    return $null
}

function Get-CommitsSinceTag {
    param([string]$Tag)
    
    if ($Tag) {
        $commits = git log "$Tag..HEAD" --oneline
    } else {
        $commits = git log --oneline
    }
    
    if ($LASTEXITCODE -ne 0) {
        throw "Failed to get git commits"
    }
    
    return $commits
}

function Analyze-Commits {
    param([string[]]$Commits)
    
    $hasMajor = $false
    $hasMinor = $false
    $hasPatch = $false
    
    foreach ($commit in $Commits) {
        $message = $commit.ToLower()
        
        # Check for breaking changes (major version)
        if ($message -match "breaking change|breaking:|\!:" -or $message -match "feat.*!:" -or $message -match "fix.*!:") {
            $hasMajor = $true
            Write-ColorOutput "  BREAKING: $commit" $Colors.Red
        }
        # Check for new features (minor version)
        elseif ($message -match "^[a-f0-9]+\s+feat(\(.+\))?:") {
            $hasMinor = $true
            Write-ColorOutput "  FEATURE: $commit" $Colors.Green
        }
        # Check for bug fixes (patch version)
        elseif ($message -match "^[a-f0-9]+\s+fix(\(.+\))?:") {
            $hasPatch = $true
            Write-ColorOutput "  FIX: $commit" $Colors.Yellow
        }
        # Other conventional commits (patch version)
        elseif ($message -match "^[a-f0-9]+\s+(chore|docs|style|refactor|perf|test)(\(.+\))?:") {
            $hasPatch = $true
            Write-ColorOutput "  OTHER: $commit" $Colors.Blue
        }
        else {
            Write-ColorOutput "  NON-CONVENTIONAL: $commit" $Colors.Magenta
            $hasPatch = $true
        }
    }
    
    # Determine version bump type
    if ($hasMajor) {
        return "major"
    } elseif ($hasMinor) {
        return "minor"
    } elseif ($hasPatch) {
        return "patch"
    } else {
        return "none"
    }
}

function Get-NextVersion {
    param(
        [string]$CurrentVersion,
        [string]$BumpType
    )
    
    if ($BumpType -eq "none") {
        return $CurrentVersion
    }
    
    $versionParts = $CurrentVersion.Split('.')
    $major = [int]$versionParts[0]
    $minor = [int]$versionParts[1]
    $patch = [int]$versionParts[2]
    
    switch ($BumpType) {
        "major" {
            $major++
            $minor = 0
            $patch = 0
        }
        "minor" {
            $minor++
            $patch = 0
        }
        "patch" {
            $patch++
        }
    }
    
    return "$major.$minor.$patch"
}

function Update-PackageVersion {
    param([string]$NewVersion)
    
    if ($DryRun) {
        Write-ColorOutput "DRY RUN: Would update package.json version to $NewVersion" $Colors.Cyan
        return
    }
    
    $packageJson = Get-Content "package.json" | ConvertFrom-Json
    $packageJson.version = $NewVersion
    $packageJson | ConvertTo-Json -Depth 10 | Set-Content "package.json"
    
    Write-ColorOutput "Updated package.json version to $NewVersion" $Colors.Green
}

function Run-Tests {
    if ($DryRun) {
        Write-ColorOutput "DRY RUN: Would run tests" $Colors.Cyan
        return $true
    }
    
    Write-ColorOutput "Running tests..." $Colors.Blue
    npm test -- --run
    
    if ($LASTEXITCODE -ne 0) {
        Write-ColorOutput "Tests failed! Aborting." $Colors.Red
        return $false
    }
    
    Write-ColorOutput "Tests passed!" $Colors.Green
    return $true
}

function Build-Project {
    if ($DryRun) {
        Write-ColorOutput "DRY RUN: Would build project" $Colors.Cyan
        return $true
    }
    
    Write-ColorOutput "Building project..." $Colors.Blue
    npm run build
    
    if ($LASTEXITCODE -ne 0) {
        Write-ColorOutput "Build failed! Aborting." $Colors.Red
        return $false
    }
    
    Write-ColorOutput "Build completed!" $Colors.Green
    return $true
}

function Commit-And-Tag {
    param(
        [string]$Version,
        [string]$BumpType
    )
    
    if ($DryRun) {
        Write-ColorOutput "DRY RUN: Would commit and tag version $Version" $Colors.Cyan
        return
    }
    
    # Add package.json changes
    git add package.json
    
    # Commit version bump
    $commitMessage = "$BumpType" + ": bump version to $Version"
    git commit -m $commitMessage
    
    # Create tag
    git tag -a "v$Version" -m "Release v$Version"
    
    Write-ColorOutput "Created commit and tag for v$Version" $Colors.Green
}

function Push-Changes {
    if ($DryRun) {
        Write-ColorOutput "DRY RUN: Would push changes and tags to origin" $Colors.Cyan
        return
    }
    
    # Push commits and tags
    git push origin main
    git push origin --tags
    
    Write-ColorOutput "Pushed changes and tags to origin" $Colors.Green
}

function Confirm-Action {
    param([string]$Message)
    
    if ($Force -or $DryRun) {
        return $true
    }
    
    $response = Read-Host "$Message (y/N)"
    return $response.ToLower() -eq "y" -or $response.ToLower() -eq "yes"
}

# Main script execution
try {
    Write-ColorOutput "Feojs Automatic Version Bump and Push Script" $Colors.Magenta
    Write-ColorOutput "================================================" $Colors.Magenta
    
    if ($DryRun) {
        Write-ColorOutput "DRY RUN MODE - No changes will be made" $Colors.Cyan
    }
    
    # Check if we're in a git repository
    git status > $null 2>&1
    if ($LASTEXITCODE -ne 0) {
        throw "Not in a git repository"
    }
    
    # Check for uncommitted changes
    $status = git status --porcelain
    if ($status -and -not $DryRun) {
        Write-ColorOutput "You have uncommitted changes:" $Colors.Yellow
        Write-ColorOutput $status $Colors.Yellow
        if (-not (Confirm-Action "Continue anyway?")) {
            Write-ColorOutput "Aborted by user" $Colors.Red
            exit 1
        }
    }
    
    # Get current version
    $currentVersion = Get-CurrentVersion
    Write-ColorOutput "Current version: $currentVersion" $Colors.Blue
    
    # Get latest tag and commits since then
    $latestTag = Get-LatestTag
    if ($latestTag) {
        Write-ColorOutput "Latest tag: $latestTag" $Colors.Blue
        $commits = Get-CommitsSinceTag $latestTag
    } else {
        Write-ColorOutput "No previous tags found, analyzing all commits" $Colors.Yellow
        $commits = Get-CommitsSinceTag ""
    }
    
    if (-not $commits) {
        Write-ColorOutput "No new commits found. Nothing to do." $Colors.Green
        exit 0
    }
    
    Write-ColorOutput "Analyzing commits since last tag:" $Colors.Blue
    $bumpType = Analyze-Commits $commits
    
    if ($bumpType -eq "none") {
        Write-ColorOutput "No version bump needed." $Colors.Green
        exit 0
    }
    
    # Calculate new version
    $newVersion = Get-NextVersion $currentVersion $bumpType
    
    Write-ColorOutput "" 
    Write-ColorOutput "Version Analysis:" $Colors.Magenta
    Write-ColorOutput "  Current version: $currentVersion" $Colors.Blue
    Write-ColorOutput "  Bump type: $bumpType" $Colors.Yellow
    Write-ColorOutput "  New version: $newVersion" $Colors.Green
    
    # Confirm before proceeding
    if (-not $DryRun -and -not (Confirm-Action "Proceed with version bump to $newVersion?")) {
        Write-ColorOutput "Aborted by user" $Colors.Red
        exit 1
    }
    
    # Update package.json
    Update-PackageVersion $newVersion
    
    # Run tests
    if (-not (Run-Tests)) {
        exit 1
    }
    
    # Build project
    if (-not (Build-Project)) {
        exit 1
    }
    
    # Commit and tag
    Commit-And-Tag $newVersion $bumpType
    
    # Push changes
    Push-Changes
    
    Write-ColorOutput "" 
    Write-ColorOutput "Successfully bumped version to $newVersion and pushed changes!" $Colors.Green
    Write-ColorOutput "Repository: https://github.com/plinsy/feojs" $Colors.Blue
    
} catch {
    Write-ColorOutput "Error: $($_.Exception.Message)" $Colors.Red
    exit 1
}

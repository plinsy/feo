# Feojs Build Scripts

This directory contains automated scripts for managing the feojs library releases.

## Push Script

The push script (`push.ps1` for Windows PowerShell, `push.sh` for Unix/Linux) automatically analyzes your git commits to determine the appropriate version bump and handles the entire release process.

### Features

- **Automatic version bumping** based on conventional commit standards
- **Commit analysis** to determine major/minor/patch version increments
- **Automated testing** before release
- **Project building** with error handling
- **Git tagging** and pushing to remote
- **Dry run mode** for previewing changes
- **Cross-platform support** (PowerShell and Bash versions)

### Conventional Commit Standards

The script analyzes commit messages to determine version bumps:

- **Major version** (Breaking changes):
  - Commits containing "BREAKING CHANGE" or "breaking:"
  - Commits with `!` after type (e.g., `feat!:`, `fix!:`)

- **Minor version** (New features):
  - Commits starting with `feat:` or `feat(scope):`

- **Patch version** (Bug fixes and other changes):
  - Commits starting with `fix:` or `fix(scope):`
  - Other conventional commits: `chore:`, `docs:`, `style:`, `refactor:`, `perf:`, `test:`
  - Non-conventional commits

### Usage

#### Windows (PowerShell)

```powershell
# Standard release
npm run push

# Preview changes without making them
npm run push:dry

# Skip confirmation prompts
npm run push:force

# Direct script execution
.\scripts\push.ps1
.\scripts\push.ps1 -DryRun
.\scripts\push.ps1 -Force
```

#### Unix/Linux/macOS (Bash)

```bash
# Make script executable (first time only)
chmod +x scripts/push.sh

# Standard release
./scripts/push.sh

# Preview changes without making them
./scripts/push.sh --dry-run

# Skip confirmation prompts
./scripts/push.sh --force
```

### What the Script Does

1. **Validates environment**: Checks for git repository and uncommitted changes
2. **Analyzes commits**: Examines commits since the last tag to determine version bump
3. **Calculates new version**: Uses semantic versioning based on commit analysis
4. **Updates package.json**: Increments version number
5. **Runs tests**: Executes `npm test -- --run` to ensure code quality
6. **Builds project**: Runs `npm run build` to generate distribution files
7. **Commits changes**: Creates a commit with the version bump
8. **Creates git tag**: Tags the release with the new version
9. **Pushes to remote**: Pushes both commits and tags to origin

### Examples

#### Scenario 1: Bug fixes only
```
Recent commits:
- fix: resolve speech recognition timeout issue
- chore: update dependencies

Result: Patch version bump (1.1.1 → 1.1.2)
```

#### Scenario 2: New feature
```
Recent commits:
- feat: add voice command recognition
- fix: improve error handling
- docs: update README

Result: Minor version bump (1.1.1 → 1.2.0)
```

#### Scenario 3: Breaking change
```
Recent commits:
- feat!: redesign API with new hook interface
- fix: resolve compatibility issues

Result: Major version bump (1.1.1 → 2.0.0)
```

### Safety Features

- **Dry run mode**: Preview all changes without making them
- **User confirmation**: Prompts before making version changes (unless `--force`)
- **Test validation**: Aborts if tests fail
- **Build validation**: Aborts if build fails
- **Git status check**: Warns about uncommitted changes

### Troubleshooting

#### PowerShell Execution Policy
If you get an execution policy error on Windows:
```powershell
Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser
```

#### No Previous Tags
If no git tags exist, the script will analyze all commits in the repository.

#### Non-Conventional Commits
Non-conventional commits are treated as patch-level changes. Consider using conventional commit messages for better automation.

## Integration with CI/CD

These scripts can be integrated into your CI/CD pipeline:

```yaml
# Example GitHub Actions workflow
- name: Automatic Version Bump and Release
  run: |
    npm run push:force
```

For more information about conventional commits, see: https://www.conventionalcommits.org/

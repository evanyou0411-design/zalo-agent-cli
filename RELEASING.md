# Release Guide

## Version Scheme

[Semantic Versioning](https://semver.org/): `MAJOR.MINOR.PATCH`

| Bump | When | Example |
|------|------|---------|
| PATCH (1.0.x) | Bug fixes, typos, dependency updates | Fix QR display on Windows |
| MINOR (1.x.0) | New features, backward compatible | Add `msg send-video` command |
| MAJOR (x.0.0) | Breaking changes | Change CLI argument format |

## Release Checklist

### 1. Ensure clean state

```bash
git status                  # No uncommitted changes
npm run lint                # 0 errors
npm run format:check        # All files formatted
npm test                    # All tests pass
npm outdated                # No critical outdated deps
```

### 2. Bump version

```bash
# Patch release (bug fix)
npm version patch -m "release: v%s"

# Minor release (new feature)
npm version minor -m "release: v%s"

# Major release (breaking change)
npm version major -m "release: v%s"
```

This auto-updates `package.json` version, creates a git commit, and tags it.

### 3. Push commit + tag

```bash
git push origin main --tags
```

### 4. Create GitHub release

```bash
VERSION=$(node -p "require('./package.json').version")
gh release create "v${VERSION}" \
  --title "v${VERSION}" \
  --generate-notes
```

`--generate-notes` auto-generates changelog from commits since last release.

### 5. (Optional) Publish to npm

```bash
npm publish
```

Requires npm account login: `npm login`

## Quick One-Liner

```bash
# Patch release (most common)
npm run lint && npm test && npm version patch -m "release: v%s" && git push origin main --tags && gh release create "v$(node -p "require('./package.json').version")" --title "v$(node -p "require('./package.json').version")" --generate-notes

# Minor release
npm run lint && npm test && npm version minor -m "release: v%s" && git push origin main --tags && gh release create "v$(node -p "require('./package.json').version")" --title "v$(node -p "require('./package.json').version")" --generate-notes
```

## Commit Messages Between Releases

Use [Conventional Commits](https://www.conventionalcommits.org/) so `--generate-notes` produces clean changelogs:

```
feat: add video message support      → shows in "New Features"
fix: handle expired QR gracefully     → shows in "Bug Fixes"
docs: update proxy setup guide        → shows in "Documentation"
chore: bump dependencies              → shows in "Maintenance"
```

## Rollback

If a release has issues:

```bash
# Delete the release
gh release delete v1.0.1 --yes

# Delete the tag
git tag -d v1.0.1
git push origin :refs/tags/v1.0.1

# Revert the version bump commit
git revert HEAD
git push origin main
```

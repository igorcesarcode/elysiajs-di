# Publishing to npm

This guide explains how to publish `@igorcesarcode/elysiajs-di` to npm.

## Prerequisites

1. **npm Account**: Create an account at [npmjs.com](https://www.npmjs.com/signup)
2. **npm CLI**: Ensure you have npm installed
3. **Organization**: For scoped packages like `@igorcesarcode/...`, you need to create an organization or use your username

## Setup npm Organization

If using a scoped package (`@igorcesarcode/elysiajs-di`):

1. Go to [npmjs.com](https://www.npmjs.com)
2. Click on your profile → "Add Organization"
3. Create organization: `igorcesarcode`

Or use your npm username as the scope.

## Step-by-Step Publishing

### 1. Login to npm

```bash
npm login
```

Enter your npm credentials.

### 2. Build the Package

```bash
cd lib/elysiajs-di
bun run build
```

### 3. Verify Package Contents

Check what files will be published:

```bash
npm pack --dry-run
```

Expected output:
```
📦  @igorcesarcode/elysiajs-di@1.0.0
=== Tarball Contents ===
...
dist/index.js
dist/index.d.ts
...
README.md
LICENSE
CHANGELOG.md
```

### 4. Publish

For scoped packages, use `--access public`:

```bash
npm publish --access public
```

## Version Management

### Semantic Versioning

- **Patch** (1.0.x): Bug fixes, no API changes
- **Minor** (1.x.0): New features, backwards compatible
- **Major** (x.0.0): Breaking changes

### Bump Version

```bash
# Patch release (1.0.0 → 1.0.1)
npm version patch

# Minor release (1.0.0 → 1.1.0)
npm version minor

# Major release (1.0.0 → 2.0.0)
npm version major
```

### Publish New Version

```bash
bun run build
npm publish --access public
```

## Using the Published Package

After publishing, install in any project:

```bash
bun add @igorcesarcode/elysiajs-di
```

```typescript
import { Module, Controller, Get } from '@igorcesarcode/elysiajs-di'
```

## Local Development with Link

For testing changes locally before publishing:

### In the library folder:

```bash
cd lib/elysiajs-di
bun run build
npm link
```

### In your project:

```bash
npm link @igorcesarcode/elysiajs-di
```

Or use `file:` protocol in package.json:

```json
{
  "dependencies": {
    "@igorcesarcode/elysiajs-di": "file:./lib/elysiajs-di"
  }
}
```

## Automation with GitHub Actions

Create `.github/workflows/publish.yml`:

```yaml
name: Publish to npm

on:
  release:
    types: [created]

jobs:
  publish:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      
      - uses: oven-sh/setup-bun@v1
        with:
          bun-version: latest
      
      - name: Install dependencies
        run: |
          cd lib/elysiajs-di
          bun install
      
      - name: Build
        run: |
          cd lib/elysiajs-di
          bun run build
      
      - name: Publish to npm
        run: |
          cd lib/elysiajs-di
          npm publish --access public
        env:
          NODE_AUTH_TOKEN: ${{ secrets.NPM_TOKEN }}
```

## Troubleshooting

### Package name already taken

Use a different name or scope:
- `@yourusername/elysiajs-di`
- `elysiajs-di-yourname`

### 403 Forbidden

- Ensure you're logged in: `npm whoami`
- For scoped packages: `npm publish --access public`

### Missing files in package

Check `files` in `package.json`:
```json
{
  "files": [
    "dist",
    "README.md",
    "LICENSE"
  ]
}
```


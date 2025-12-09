# Development Workflow

This document describes the development workflow for the ElysiaJS-DI library and example server.

## Project Structure

```
app/
├── lib/
│   └── elysiajs-di/     # The library (separate git repo)
│       ├── decorators/
│       ├── factory/
│       ├── plugins/
│       ├── types/
│       ├── tests/
│       ├── docs/
│       └── package.json
├── server/              # Example server (separate git repo)
│   ├── src/
│   │   ├── modules/
│   │   ├── app.module.ts
│   │   └── main.ts
│   └── package.json
├── Makefile             # Development commands
└── docs/
    └── DEVELOPMENT.md   # This file
```

## Quick Start

### First Time Setup

```bash
# Install all dependencies
make install

# Build and link library, then start server
make dev-full
```

### Daily Development

```bash
# If working on the library
make lib-dev        # Build and link
make lib-test       # Run tests
make server-dev     # Test in server

# If only working on server
make server-dev     # Start development server
```

## Workflow Scenarios

### Scenario 1: Developing the Library

When making changes to the library:

1. **Make changes** to files in `lib/elysiajs-di/`

2. **Run tests**

   ```bash
   make lib-test
   # or watch mode
   make lib-test-watch
   ```

3. **Rebuild and link**

   ```bash
   make lib-link
   ```

4. **Test in server**

   ```bash
   make server-local  # Links local lib
   make server-dev    # Starts server
   ```

5. **Verify changes** by accessing http://localhost:3000

### Scenario 2: Developing the Server

When making changes only to the server:

1. **Start development server**

   ```bash
   make server-dev
   ```

2. Server will hot-reload on changes

### Scenario 3: Testing Against npm Version

To verify the server works with the published npm version:

```bash
make server-npm    # Switches to npm version
make server-dev    # Starts server
```

### Scenario 4: Publishing a New Library Version

1. **Run all tests**

   ```bash
   make test
   ```

2. **Update version** in `lib/elysiajs-di/package.json`

3. **Update CHANGELOG.md**

4. **Publish**
   ```bash
   make publish
   ```

## Commands Reference

### Library Commands

| Command               | Description                  |
| --------------------- | ---------------------------- |
| `make lib-install`    | Install library dependencies |
| `make lib-build`      | Build the library            |
| `make lib-test`       | Run library tests            |
| `make lib-test-watch` | Run tests in watch mode      |
| `make lib-lint`       | Type check the library       |
| `make lib-link`       | Build and link for local dev |
| `make lib-dev`        | Alias for lib-link           |

### Server Commands

| Command               | Description                 |
| --------------------- | --------------------------- |
| `make server-install` | Install server dependencies |
| `make server-dev`     | Run development server      |
| `make server-start`   | Run production server       |
| `make server-build`   | Build for production        |
| `make server-test`    | Run server tests            |
| `make server-local`   | Use local library           |
| `make server-npm`     | Use npm library             |

### Combined Commands

| Command         | Description              |
| --------------- | ------------------------ |
| `make install`  | Install all dependencies |
| `make dev`      | Setup dev environment    |
| `make dev-full` | Setup and start server   |
| `make test`     | Run all tests            |
| `make build`    | Build everything         |
| `make clean`    | Clean build artifacts    |
| `make publish`  | Publish to npm           |

## How Local Linking Works

### bun link

Bun's link feature creates a symlink from the global package directory to your local library:

```bash
# In lib/elysiajs-di
bun link  # Registers the package globally

# In server
bun link @igorcesarcode/elysiajs-di  # Links to local version
```

### Switching Between Local and npm

```bash
# Use local version
bun link @igorcesarcode/elysiajs-di

# Use npm version
bun remove @igorcesarcode/elysiajs-di
bun add @igorcesarcode/elysiajs-di
```

## Separating into Two Git Repositories

When you're ready to separate:

### Library Repository

1. Copy `lib/elysiajs-di/` to a new location
2. Initialize git:
   ```bash
   cd elysiajs-di
   git init
   git add .
   git commit -m "Initial commit"
   git remote add origin https://github.com/igorcesarcode/elysiajs-di.git
   git push -u origin main
   ```

### Server Repository

1. Copy `server/` to a new location
2. Update `package.json` to use npm version:
   ```json
   "@igorcesarcode/elysiajs-di": "^1.0.0"
   ```
3. Initialize git:
   ```bash
   cd server
   git init
   git add .
   git commit -m "Initial commit"
   ```

### Development After Separation

For local library development with separated repos:

```bash
# In library repo
cd ~/projects/elysiajs-di
bun run dev  # Builds and links

# In server repo
cd ~/projects/server
bun link @igorcesarcode/elysiajs-di
bun run dev
```

## CI/CD Considerations

### Library CI

```yaml
# .github/workflows/ci.yml
name: CI
on: [push, pull_request]
jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: oven-sh/setup-bun@v1
      - run: bun install
      - run: bun test
      - run: bun run build
```

### Library Publishing

```yaml
# .github/workflows/publish.yml
name: Publish
on:
  release:
    types: [created]
jobs:
  publish:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: oven-sh/setup-bun@v1
      - run: bun install
      - run: bun test
      - run: bun run build
      - run: npm publish --access public
        env:
          NODE_AUTH_TOKEN: ${{ secrets.NPM_TOKEN }}
```

## Troubleshooting

### Link Not Working

If `bun link` doesn't seem to work:

```bash
# Unlink and relink
bun unlink @igorcesarcode/elysiajs-di
cd lib/elysiajs-di
bun link
cd ../server
bun link @igorcesarcode/elysiajs-di
```

### Type Errors After Changes

If you see type errors after library changes:

```bash
# Rebuild the library
make lib-build

# Restart TypeScript server in your IDE
# VSCode: Cmd+Shift+P -> "TypeScript: Restart TS Server"
```

### Changes Not Reflecting

If changes don't appear in the server:

1. Ensure library is rebuilt: `make lib-build`
2. Restart the server: `make server-dev`
3. Clear bun cache if needed: `rm -rf ~/.bun/install/cache`

# Contributing to ElysiaJS-DI

Thank you for your interest in contributing to ElysiaJS-DI! This document provides guidelines and instructions for contributing.

## Development Setup

### Prerequisites

- [Bun](https://bun.sh) >= 1.3.0
- Node.js >= 18 (for npm publishing)

### Local Development

1. **Clone the repository**

```bash
git clone https://github.com/igorcesarcode/elysiajs-di.git
cd elysiajs-di
```

2. **Install dependencies**

```bash
bun install
```

3. **Run tests**

```bash
bun test
```

4. **Build the library**

```bash
bun run build
```

## Testing Locally with Another Project

To test the library locally before publishing:

### Step 1: Link the library

In the library directory:

```bash
cd /path/to/elysiajs-di
bun run dev  # This builds and links the package
```

Or manually:

```bash
bun run build
bun link
```

### Step 2: Use the linked library in your project

In your project directory:

```bash
cd /path/to/your-project
bun link @igorcesarcode/elysiajs-di
```

### Step 3: Unlink when done

To switch back to the npm version:

```bash
cd /path/to/your-project
bun remove @igorcesarcode/elysiajs-di
bun add @igorcesarcode/elysiajs-di
```

## Development Workflow

### Making Changes

1. Create a new branch for your feature/fix:

```bash
git checkout -b feature/your-feature-name
```

2. Make your changes

3. Write/update tests for your changes

4. Run tests:

```bash
bun test
```

5. Ensure TypeScript types are correct:

```bash
bun run lint
```

6. Build to verify everything compiles:

```bash
bun run build
```

### Testing Your Changes

#### Unit Tests

```bash
# Run all tests
bun test

# Run tests in watch mode
bun test --watch

# Run tests with coverage
bun test --coverage
```

#### Integration Testing

1. Link the library to a test project
2. Test the functionality manually
3. Verify OpenAPI documentation works
4. Check lifecycle hooks are called correctly

### Code Style

- Use TypeScript strict mode
- Follow existing code patterns
- Add JSDoc comments for public APIs
- Export types for all public interfaces

## Pull Request Process

1. Update documentation if needed
2. Add tests for new features
3. Update CHANGELOG.md
4. Ensure all tests pass
5. Request review from maintainers

## Publishing (Maintainers Only)

### Pre-release Checklist

- [ ] All tests pass
- [ ] Documentation is updated
- [ ] CHANGELOG.md is updated
- [ ] Version is bumped appropriately

### Release Process

1. Update version in `package.json`
2. Update CHANGELOG.md
3. Commit changes:

```bash
git add .
git commit -m "chore: release v1.x.x"
```

4. Create a git tag:

```bash
git tag v1.x.x
git push origin v1.x.x
```

5. Publish to npm:

```bash
bun run release
```

Or manually:

```bash
bun run build
npm publish --access public
```

## Versioning

We follow [Semantic Versioning](https://semver.org/):

- **MAJOR**: Breaking changes
- **MINOR**: New features (backwards compatible)
- **PATCH**: Bug fixes (backwards compatible)

## Questions?

Feel free to open an issue for any questions or suggestions!

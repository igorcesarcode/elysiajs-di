# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

## [0.0.7-beta] - 2024-12-10

### Fixed
- **AuthGuard JWT Authentication**: Fixed critical bug where AuthGuard was always returning 401 even with valid tokens
  - Fixed header extraction to read from multiple sources (`context.headers`, `context.request.headers`)
  - Improved token extraction to handle different header formats in ElysiaJS
  - Added validation to require "Bearer" prefix in Authorization header for security
- **JWT Plugin Availability**: Fixed JWT plugin not being available in guard execution context
  - Store JWT plugin instance when registered on main app
  - Apply JWT plugin to controller plugins to ensure availability in guard context
  - Improved plugin instance management in ModuleFactory

### Added
- **Guards System**: Complete guards implementation similar to NestJS
  - `@UseGuards()` decorator for route protection
  - `CanActivate` interface for guard implementation
  - `ExecutionContext` interface for guard access to request context
  - Support for multiple guards on same route
- **JWT Service**: Comprehensive JWT service for token management
  - `JwtService` class with sign/verify methods
  - `extractToken()` method for extracting tokens from headers
  - `extractTokenFromContext()` method for Elysia context
  - `verifyFromContext()` convenience method
  - Automatic plugin name configuration
- **Enhanced Error Handling**: Improved error handling in AuthGuard
  - Distinguish between different error types (401 vs 500)
  - Better error messages for debugging
  - Proper handling of JWT plugin unavailability

### Changed
- **AuthGuard Simplification**: Simplified AuthGuard implementation
  - Moved complex header reading logic to JwtService
  - Cleaner, more maintainable code similar to NestJS pattern
  - Better separation of concerns
- **ModuleFactory**: Enhanced plugin management
  - Store JWT plugin instance for reuse
  - Apply plugins to controller plugins automatically
  - Improved reset() method to clear plugin instances

### Documentation
- Added troubleshooting guide for AuthGuard JWT issues
- Comprehensive documentation of problem and solution
- Updated main documentation index

## [Unreleased]

### Added
- Initial release of ElysiaJS-DI

## [1.0.0] - 2024-12-09

### Added

#### Core Features
- `@Module()` decorator for defining application modules
- `@Controller()` decorator for HTTP controllers
- HTTP method decorators: `@Get()`, `@Post()`, `@Put()`, `@Delete()`, `@Patch()`
- `@Singleton()` decorator for singleton providers
- `@Injectable()` decorator for transient providers

#### Dependency Injection
- TSyringe-based dependency injection container
- Constructor injection support
- Module-scoped provider registration
- Provider exports between modules

#### Lifecycle Hooks
- `OnModuleInit` - Called after module dependencies resolved
- `OnApplicationBootstrap` - Called after all modules initialized
- `OnModuleDestroy` - Called on application termination
- `BeforeApplicationShutdown` - Called before listeners stop
- `OnApplicationShutdown` - Called after listeners stop
- Graceful shutdown handling for SIGINT and SIGTERM

#### Validation
- Zod schema validation integration
- Body validation
- Params validation (with coercion)
- Query validation (with coercion)
- Headers validation
- Response validation
- Detailed validation error messages

#### Logging
- NestJS-style logging format
- `ApplicationLogger` class for services
- Color-coded log levels (LOG, WARN, ERROR, DEBUG, VERBOSE)
- Timestamp and process ID in logs
- Context-aware logging
- Internal framework logging

#### Error Handling
- Centralized error handling in ModuleFactory
- 404 Not Found handling with ignored paths
- Validation error formatting
- Internal error handling

### Documentation
- Comprehensive README
- Getting Started guide
- Modules documentation
- Controllers documentation
- Providers documentation
- Lifecycle hooks documentation
- Validation documentation
- Logging documentation
- Contributing guide

## [0.1.0] - 2024-12-09

### Added
- Initial project structure
- Basic module system
- Controller registration
- Route mapping


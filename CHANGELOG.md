# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

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


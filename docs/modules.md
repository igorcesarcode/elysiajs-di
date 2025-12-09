# Modules

Modules are the fundamental building blocks of ElysiaJS-DI applications. They help organize your application into cohesive units of functionality.

## Overview

A module is a class decorated with `@Module()` that provides metadata about how to compose the application.

```typescript
@Module({
  imports: [],      // Other modules to import
  controllers: [],  // Controllers to register
  providers: [],    // Services/providers to register
  exports: []       // Providers to export
})
class UserModule {}
```

## Module Metadata

### imports

An array of modules that this module depends on. When you import a module, its exported providers become available for injection.

```typescript
@Module({
  imports: [DatabaseModule, LoggerModule]
})
class UserModule {}
```

### controllers

An array of controllers that belong to this module. Controllers handle HTTP requests.

```typescript
@Module({
  controllers: [UserController, ProfileController]
})
class UserModule {}
```

### providers

An array of providers (services) that will be instantiated by the DI container. These are available for injection within this module.

```typescript
@Module({
  providers: [UserService, UserRepository]
})
class UserModule {}
```

### exports

An array of providers that should be available to other modules that import this module.

```typescript
@Module({
  providers: [UserService],
  exports: [UserService] // Now available to importing modules
})
class UserModule {}
```

## Feature Modules

Feature modules organize code related to a specific feature or domain:

```typescript
// modules/user/user.module.ts
@Module({
  imports: [DatabaseModule],
  controllers: [UserController],
  providers: [UserService, UserRepository],
  exports: [UserService]
})
export class UserModule {}
```

## Shared Modules

Shared modules contain reusable functionality used across multiple feature modules:

```typescript
// modules/shared/logger/logger.module.ts
@Singleton()
export class Logger {
  log(message: string) {
    console.log(message)
  }
}

@Module({
  providers: [Logger],
  exports: [Logger]
})
export class LoggerModule {}
```

Using a shared module:

```typescript
@Module({
  imports: [LoggerModule], // Import the shared module
  controllers: [UserController],
  providers: [UserService]
})
export class UserModule {}

// UserService can now inject Logger
@Singleton()
class UserService {
  constructor(private logger: Logger) {}
}
```

## Root Module

Every application has a root module (conventionally named `AppModule`) that imports all feature modules:

```typescript
// app.module.ts
@Module({
  imports: [
    LoggerModule,
    DatabaseModule,
    UserModule,
    AuthModule,
    ProductModule
  ]
})
export class AppModule {}
```

## Module Registration Order

Modules are registered in the order they appear in the `imports` array. This matters when modules have dependencies on each other:

```typescript
@Module({
  imports: [
    ConfigModule,    // First - provides config
    DatabaseModule,  // Second - uses config
    UserModule       // Third - uses database
  ]
})
export class AppModule {}
```

## Dynamic Modules (Coming Soon)

Dynamic modules allow you to configure modules with custom options:

```typescript
// Future API
@Module({
  imports: [
    DatabaseModule.forRoot({
      host: 'localhost',
      port: 5432
    })
  ]
})
export class AppModule {}
```

## Best Practices

### 1. Single Responsibility

Each module should focus on a single feature or domain:

```typescript
// ✅ Good - focused on users
@Module({
  controllers: [UserController],
  providers: [UserService]
})
class UserModule {}

// ❌ Bad - too many responsibilities
@Module({
  controllers: [UserController, ProductController, OrderController],
  providers: [UserService, ProductService, OrderService]
})
class EverythingModule {}
```

### 2. Explicit Exports

Only export what other modules actually need:

```typescript
// ✅ Good - only export what's needed
@Module({
  providers: [UserService, UserRepository],
  exports: [UserService] // Only service is exported
})
class UserModule {}
```

### 3. Avoid Circular Dependencies

Design your modules to avoid circular imports:

```typescript
// ❌ Bad - circular dependency
// UserModule imports OrderModule
// OrderModule imports UserModule

// ✅ Good - extract shared logic
@Module({
  providers: [SharedService],
  exports: [SharedService]
})
class SharedModule {}

@Module({
  imports: [SharedModule]
})
class UserModule {}

@Module({
  imports: [SharedModule]
})
class OrderModule {}
```

### 4. Barrel Exports

Use index.ts files for clean imports:

```typescript
// modules/user/index.ts
export * from './user.service'
export * from './user.controller'
export * from './user.module'

// Usage
import { UserModule, UserService } from './modules/user'
```

## Example: Complete Module Structure

```
modules/
└── user/
    ├── dto/
    │   ├── create-user.dto.ts
    │   └── update-user.dto.ts
    ├── entities/
    │   └── user.entity.ts
    ├── user.controller.ts
    ├── user.service.ts
    ├── user.repository.ts
    ├── user.module.ts
    └── index.ts
```

```typescript
// user.module.ts
import { Module } from 'elysiajs-di'
import { DatabaseModule } from '../database'
import { LoggerModule } from '../shared/logger'
import { UserController } from './user.controller'
import { UserService } from './user.service'
import { UserRepository } from './user.repository'

@Module({
  imports: [DatabaseModule, LoggerModule],
  controllers: [UserController],
  providers: [UserService, UserRepository],
  exports: [UserService]
})
export class UserModule {}
```


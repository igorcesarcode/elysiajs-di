# API Reference

Complete API documentation for ElysiaJS-DI.

## Table of Contents

- [Decorators](#decorators)
- [Classes](#classes)
- [Interfaces](#interfaces)
- [Types](#types)

---

## Decorators

### @Module(metadata)

Defines a module that groups related functionality.

```typescript
function Module(metadata: ModuleMetadata): ClassDecorator
```

**Parameters:**

| Name | Type | Description |
|------|------|-------------|
| metadata | `ModuleMetadata` | Configuration object for the module |

**ModuleMetadata:**

| Property | Type | Required | Description |
|----------|------|----------|-------------|
| imports | `Constructor[]` | No | Modules to import |
| controllers | `Constructor[]` | No | Controllers to register |
| providers | `Constructor[]` | No | Providers to register |
| exports | `Constructor[]` | No | Providers to export |

**Example:**

```typescript
@Module({
  imports: [DatabaseModule],
  controllers: [UserController],
  providers: [UserService],
  exports: [UserService]
})
class UserModule {}
```

---

### @Controller(path?)

Marks a class as an HTTP controller.

```typescript
function Controller(path?: string): ClassDecorator
```

**Parameters:**

| Name | Type | Default | Description |
|------|------|---------|-------------|
| path | `string` | `''` | Base path for all routes |

**Example:**

```typescript
@Controller('/users')
class UserController {}
```

---

### @Get(path?, options?)

Defines a GET route handler.

```typescript
function Get(path?: string, options?: ValidationOptions): MethodDecorator
```

**Parameters:**

| Name | Type | Default | Description |
|------|------|---------|-------------|
| path | `string` | `''` | Route path |
| options | `ValidationOptions` | `undefined` | Validation schemas |

**Example:**

```typescript
@Get('/:id', {
  params: z.object({ id: z.coerce.number() })
})
getUserById({ params }) {
  return this.service.findById(params.id)
}
```

---

### @Post(path?, options?)

Defines a POST route handler.

```typescript
function Post(path?: string, options?: ValidationOptions): MethodDecorator
```

**Parameters:**

| Name | Type | Default | Description |
|------|------|---------|-------------|
| path | `string` | `''` | Route path |
| options | `ValidationOptions` | `undefined` | Validation schemas |

**Example:**

```typescript
@Post('/', {
  body: z.object({
    name: z.string(),
    email: z.string().email()
  })
})
createUser({ body }) {
  return this.service.create(body)
}
```

---

### @Put(path?, options?)

Defines a PUT route handler.

```typescript
function Put(path?: string, options?: ValidationOptions): MethodDecorator
```

---

### @Patch(path?, options?)

Defines a PATCH route handler.

```typescript
function Patch(path?: string, options?: ValidationOptions): MethodDecorator
```

---

### @Delete(path?, options?)

Defines a DELETE route handler.

```typescript
function Delete(path?: string, options?: ValidationOptions): MethodDecorator
```

---

### @Singleton()

Marks a class as a singleton provider.

```typescript
function Singleton(): ClassDecorator
```

**Example:**

```typescript
@Singleton()
class DatabaseService {
  // Same instance across application
}
```

---

### @Injectable()

Marks a class as an injectable provider.

```typescript
function Injectable(): ClassDecorator
```

**Example:**

```typescript
@Injectable()
class RequestLogger {
  // New instance per injection
}
```

---

## Classes

### ModuleFactory

Factory for bootstrapping the application.

```typescript
class ModuleFactory {
  constructor(options?: BootstrapOptions)
  
  async bootstrap(
    rootModule: Constructor,
    app: Elysia
  ): Promise<void>
  
  setErrorHandler(handler: ErrorHandler): void
}
```

**Constructor Options:**

| Property | Type | Default | Description |
|----------|------|---------|-------------|
| ignoredPaths | `string[]` | `['favicon.ico']` | Paths to ignore for 404 logging |
| enableLifecycleHooks | `boolean` | `true` | Enable lifecycle hooks |

**Methods:**

#### bootstrap(rootModule, app)

Bootstraps the application with the root module.

```typescript
const factory = new ModuleFactory()
await factory.bootstrap(AppModule, app)
```

#### setErrorHandler(handler)

Sets a custom error handler.

```typescript
factory.setErrorHandler(({ code, error, set }) => {
  // Custom error handling
})
```

---

### ApplicationLogger

Logger class for use in services and controllers.

```typescript
class ApplicationLogger {
  constructor(context: string)
  
  log(message: string, ...optionalParams: any[]): void
  warn(message: string, ...optionalParams: any[]): void
  error(message: string, ...optionalParams: any[]): void
  debug(message: string, ...optionalParams: any[]): void
  verbose(message: string, ...optionalParams: any[]): void
  
  static setAppName(name: string): void
}
```

**Example:**

```typescript
@Singleton()
class UserService {
  private readonly logger = new ApplicationLogger(UserService.name)
  
  findAll() {
    this.logger.log('Fetching users')
  }
}
```

---

## Interfaces

### ModuleMetadata

```typescript
interface ModuleMetadata {
  imports?: Constructor[]
  controllers?: Constructor[]
  providers?: Constructor[]
  exports?: Constructor[]
}
```

---

### RouteMetadata

```typescript
interface RouteMetadata {
  method: 'get' | 'post' | 'put' | 'delete' | 'patch'
  path: string
  handlerName: string
  validationOptions?: ValidationOptions
}
```

---

### ValidationOptions

```typescript
interface ValidationOptions {
  body?: Schema
  params?: Schema
  query?: Schema
  headers?: Schema
  response?: Schema
}
```

---

### ElysiaContext

```typescript
interface ElysiaContext<
  Body = unknown,
  Params extends Record<string, string> = Record<string, string>,
  Query extends Record<string, string | undefined> = Record<string, string | undefined>,
  Headers extends Record<string, string | undefined> = Record<string, string | undefined>
> {
  params: Params
  query: Query
  body: Body
  headers: Headers
  request: Request
  set: {
    status?: number
    headers: Record<string, string>
  }
}
```

---

### ErrorContext

```typescript
interface ErrorContext {
  code: string
  error: Error
  set: {
    status?: number
    headers: Record<string, string>
  }
  request: Request
  path: string
}
```

---

### ErrorHandler

```typescript
type ErrorHandler = (context: ErrorContext) => unknown
```

---

### BootstrapOptions

```typescript
interface BootstrapOptions {
  ignoredPaths?: string[]
  enableLifecycleHooks?: boolean
}
```

---

## Lifecycle Interfaces

### OnModuleInit

```typescript
interface OnModuleInit {
  onModuleInit(): Promise<void> | void
}
```

### OnApplicationBootstrap

```typescript
interface OnApplicationBootstrap {
  onApplicationBootstrap(): Promise<void> | void
}
```

### OnModuleDestroy

```typescript
interface OnModuleDestroy {
  onModuleDestroy(): Promise<void> | void
}
```

### BeforeApplicationShutdown

```typescript
interface BeforeApplicationShutdown {
  beforeApplicationShutdown(signal?: string): Promise<void> | void
}
```

### OnApplicationShutdown

```typescript
interface OnApplicationShutdown {
  onApplicationShutdown(signal?: string): Promise<void> | void
}
```

---

## Types

### Constructor

```typescript
type Constructor<T = any> = new (...args: any[]) => T
```

### Schema

```typescript
type Schema = ZodSchema | TSchema
```

---

## Exports

Main exports from the library:

```typescript
// Decorators
export { Module } from './decorators/module.decorator'
export { Controller } from './decorators/controller.decorator'
export { Get, Post, Put, Delete, Patch } from './decorators/http-methods.decorator'
export { singleton as Singleton, injectable as Injectable } from './decorators/di.decorator'

// Classes
export { ModuleFactory } from './factory/module.factory'
export { ApplicationLogger } from './factory/application-logger'

// Types & Interfaces
export type {
  ModuleMetadata,
  RouteMetadata,
  ValidationOptions,
  ElysiaContext,
  ErrorContext,
  ErrorHandler,
  BootstrapOptions,
  Constructor,
  Schema
} from './types'

// Lifecycle Interfaces
export type {
  OnModuleInit,
  OnApplicationBootstrap,
  OnModuleDestroy,
  BeforeApplicationShutdown,
  OnApplicationShutdown
} from './types/lifecycle'
```


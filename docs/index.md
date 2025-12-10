# ElysiaJS-DI Documentation

Welcome to the ElysiaJS-DI documentation. This library brings NestJS-style architecture to ElysiaJS applications.

## Table of Contents

1. [Getting Started](./getting-started.md)
   - Installation
   - Configuration
   - First Module

2. [Core Concepts](./modules.md)
   - [Modules](./modules.md)
   - [Controllers](./controllers.md)
   - [Providers](./providers.md)

3. [Features](./validation.md)
   - [Validation](./validation.md)
   - [Lifecycle Hooks](./lifecycle.md)
   - [Logging](./logging.md)

4. [Troubleshooting](./troubleshooting-auth-guard.md)
   - [AuthGuard JWT Authentication Issues](./troubleshooting-auth-guard.md)

## Quick Reference

### Decorators

```typescript
// Module
@Module({
  imports: [],
  controllers: [],
  providers: [],
  exports: []
})

// Controller & Routes
@Controller('/path')
@Get('/route')
@Post('/route')
@Put('/route')
@Patch('/route')
@Delete('/route')

// Providers
@Singleton()  // Single shared instance
@Injectable() // New instance per injection
```

### Lifecycle Hooks

```typescript
interface OnModuleInit {
  onModuleInit(): Promise<void> | void
}

interface OnApplicationBootstrap {
  onApplicationBootstrap(): Promise<void> | void
}

interface OnModuleDestroy {
  onModuleDestroy(): Promise<void> | void
}

interface BeforeApplicationShutdown {
  beforeApplicationShutdown(signal?: string): Promise<void> | void
}

interface OnApplicationShutdown {
  onApplicationShutdown(signal?: string): Promise<void> | void
}
```

### Validation

```typescript
import { z } from 'zod'

@Post('/', {
  body: z.object({ name: z.string() }),
  params: z.object({ id: z.coerce.number() }),
  query: z.object({ page: z.coerce.number().default(1) }),
  headers: z.object({ authorization: z.string() })
})
```

### Logging

```typescript
import { ApplicationLogger } from '@igorcesarcode/elysiajs-di'

const logger = new ApplicationLogger('MyContext')
logger.log('Info message')
logger.warn('Warning message')
logger.error('Error message')
logger.debug('Debug message')
logger.verbose('Verbose message')
```

## Architecture Overview

```
                    ┌──────────────────┐
                    │    AppModule     │
                    │   (Root Module)  │
                    └────────┬─────────┘
                             │
           ┌─────────────────┼─────────────────┐
           │                 │                 │
    ┌──────▼──────┐   ┌──────▼──────┐   ┌──────▼──────┐
    │ UserModule  │   │ AuthModule  │   │ SharedModule│
    └──────┬──────┘   └──────┬──────┘   └──────┬──────┘
           │                 │                 │
    ┌──────▼──────┐   ┌──────▼──────┐   ┌──────▼──────┐
    │UserController│  │AuthController│  │   Logger    │
    │ UserService │   │ AuthService │   │   Config    │
    └─────────────┘   └─────────────┘   └─────────────┘
```

## Example Application

```typescript
// main.ts
import { Elysia } from 'elysia'
import { ModuleFactory } from '@igorcesarcode/elysiajs-di'
import { AppModule } from './app.module'

const app = new Elysia()
const factory = new ModuleFactory()

await factory.bootstrap(AppModule, app)

app.listen(3000, () => {
  console.log('🚀 Server running at http://localhost:3000')
})
```

## Version Compatibility

| ElysiaJS-DI | ElysiaJS | Node.js | TypeScript |
|-------------|----------|---------|------------|
| 1.x         | ≥1.0     | ≥18     | ≥5.0       |

## Support

- [GitHub Issues](https://github.com/your-repo/elysiajs-di/issues)
- [Contributing Guide](../CONTRIBUTING.md)


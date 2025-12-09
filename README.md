# ElysiaJS-DI

<p align="center">
  <img src="./docs/logo.svg" width="120" alt="ElysiaJS-DI Logo" />
</p>

<p align="center">
  A <strong>NestJS-inspired</strong> dependency injection and module system for <a href="https://elysiajs.com">ElysiaJS</a>.
</p>

<p align="center">
  <a href="#installation">Installation</a> •
  <a href="#quick-start">Quick Start</a> •
  <a href="#features">Features</a> •
  <a href="#documentation">Documentation</a> •
  <a href="#api-reference">API Reference</a>
</p>

---

## Overview

**ElysiaJS-DI** brings the power of NestJS-style architecture to ElysiaJS applications. It provides:

- 🏗️ **Module System** - Organize your application into cohesive modules
- 💉 **Dependency Injection** - Powered by TSyringe for robust DI
- 🎯 **Decorators** - Familiar decorators like `@Controller`, `@Get`, `@Post`
- ♻️ **Lifecycle Hooks** - `OnModuleInit`, `OnApplicationShutdown`, and more
- ✅ **Validation** - Built-in Zod schema validation support
- 📝 **NestJS-style Logging** - Beautiful, structured console output
- 📚 **OpenAPI/Swagger** - Automatic API documentation generation
- 📊 **OpenTelemetry** - Distributed tracing and observability

## Installation

This package is designed for **Bun** runtime. Install it using:

```bash
bun add @igorcesarcode/elysiajs-di reflect-metadata tsyringe
```

> **Note:** While this package may work with Node.js, it's optimized for Bun and requires Bun >= 1.3.0.

### TypeScript Configuration

Add the following to your `tsconfig.json`:

```json
{
  "compilerOptions": {
    "experimentalDecorators": true,
    "emitDecoratorMetadata": true
  }
}
```

## Quick Start

```typescript
import { Elysia } from "elysia";
import {
  Module,
  Controller,
  Get,
  Post,
  Singleton,
  ModuleFactory,
  ApplicationLogger,
} from "@igorcesarcode/elysiajs-di";
import { z } from "zod";

// 1. Create a Service
@Singleton()
class UserService {
  private readonly logger = new ApplicationLogger(UserService.name);
  private users = [{ id: 1, name: "John Doe" }];

  findAll() {
    this.logger.log("Fetching all users");
    return this.users;
  }
}

// 2. Create a Controller
@Controller("/users")
class UserController {
  constructor(private userService: UserService) {}

  @Get()
  getAllUsers() {
    return this.userService.findAll();
  }

  @Post("/", {
    body: z.object({
      name: z.string().min(2),
    }),
  })
  createUser({ body }) {
    return { id: Date.now(), ...body };
  }
}

// 3. Create a Module
@Module({
  controllers: [UserController],
  providers: [UserService],
})
class UserModule {}

// 4. Create Root Module
@Module({
  imports: [UserModule],
})
class AppModule {}

// 5. Bootstrap the Application
const app = new Elysia();
const factory = new ModuleFactory();

await factory.bootstrap(AppModule, app);

app.listen(3000, () => {
  console.log("🚀 Server running at http://localhost:3000");
});
```

## Features

### Module System

Organize your application into feature modules:

```typescript
@Module({
  imports: [SharedModule], // Import other modules
  controllers: [UserController], // HTTP Controllers
  providers: [UserService], // Services/Providers
  exports: [UserService], // Export for other modules
})
class UserModule {}
```

### Dependency Injection

Use `@Singleton()` for shared instances or `@Injectable()` for transient instances:

```typescript
@Singleton()
class DatabaseService {
  // Same instance across the application
}

@Injectable()
class RequestService {
  // New instance for each injection
}
```

### HTTP Decorators

Full suite of HTTP method decorators:

```typescript
@Controller('/api/users')
class UserController {
  @Get()           // GET /api/users
  @Get('/:id')     // GET /api/users/:id
  @Post()          // POST /api/users
  @Put('/:id')     // PUT /api/users/:id
  @Patch('/:id')   // PATCH /api/users/:id
  @Delete('/:id')  // DELETE /api/users/:id
}
```

### Validation with Zod

Built-in support for Zod schema validation:

```typescript
@Post('/', {
  body: z.object({
    name: z.string().min(2),
    email: z.string().email()
  }),
  params: z.object({
    id: z.coerce.number()
  })
})
createUser({ body, params }) {
  // body and params are validated and typed!
}
```

### Lifecycle Hooks

Hook into application lifecycle events:

```typescript
@Singleton()
class DatabaseService implements OnModuleInit, OnApplicationShutdown {
  async onModuleInit() {
    // Connect to database
  }

  async onApplicationShutdown(signal?: string) {
    // Close connections
  }
}
```

### Application Logger

NestJS-style logging with colors:

```typescript
@Singleton()
class UserService {
  private readonly logger = new ApplicationLogger(UserService.name);

  findAll() {
    this.logger.log("Fetching users"); // Green
    this.logger.warn("Cache miss"); // Yellow
    this.logger.error("Database error"); // Red
    this.logger.debug("Query executed"); // Magenta
  }
}
```

Output:

```
[Elysia] 12345  - 12/09/2025 - 05:30 PM     LOG   [UserService] Fetching users +0ms
[Elysia] 12345  - 12/09/2025 - 05:30 PM     WARN  [UserService] Cache miss +1ms
[Elysia] 12345  - 12/09/2025 - 05:30 PM     ERROR [UserService] Database error +0ms
```

### OpenAPI/Swagger Integration

Generate automatic API documentation:

```bash
bun add @elysiajs/openapi
```

```typescript
import { registerOpenAPI, SecuritySchemes } from "@igorcesarcode/elysiajs-di";

// After bootstrap
await registerOpenAPI(app, {
  path: "/swagger",
  documentation: {
    info: {
      title: "My API",
      version: "1.0.0",
    },
    tags: [{ name: "Users", description: "User endpoints" }],
    components: {
      securitySchemes: {
        bearerAuth: SecuritySchemes.bearerAuth,
      },
    },
  },
});

// Add OpenAPI details to routes
@Get("/", {
  detail: {
    tags: ["Users"],
    summary: "Get all users",
    description: "Returns a list of all users",
  },
})
getAllUsers() {
  return this.userService.findAll();
}
```

### OpenTelemetry Integration

Add distributed tracing:

```bash
bun add @elysiajs/opentelemetry
```

```typescript
import { registerOpenTelemetry } from "@igorcesarcode/elysiajs-di";

// Register BEFORE bootstrap
await registerOpenTelemetry(app, {
  serviceName: "my-api",
});

// Then bootstrap
await factory.bootstrap(AppModule, app);
```

## Documentation

For detailed documentation, see the [docs](./docs) folder:

- [Getting Started](./docs/getting-started.md)
- [Modules](./docs/modules.md)
- [Controllers](./docs/controllers.md)
- [Providers](./docs/providers.md)
- [Lifecycle Hooks](./docs/lifecycle.md)
- [Validation](./docs/validation.md)
- [Logging](./docs/logging.md)
- [OpenAPI Integration](./docs/openapi.md)
- [OpenTelemetry Integration](./docs/opentelemetry.md)

## API Reference

### Decorators

| Decorator                  | Description                                                    |
| -------------------------- | -------------------------------------------------------------- |
| `@Module(metadata)`        | Defines a module with imports, controllers, providers, exports |
| `@Controller(path)`        | Defines an HTTP controller with a base path                    |
| `@Get(path?, options?)`    | HTTP GET route                                                 |
| `@Post(path?, options?)`   | HTTP POST route                                                |
| `@Put(path?, options?)`    | HTTP PUT route                                                 |
| `@Delete(path?, options?)` | HTTP DELETE route                                              |
| `@Patch(path?, options?)`  | HTTP PATCH route                                               |
| `@Singleton()`             | Marks class as singleton (shared instance)                     |
| `@Injectable()`            | Marks class as injectable (new instance each time)             |

### Lifecycle Interfaces

| Interface                   | Method                              | When Called                            |
| --------------------------- | ----------------------------------- | -------------------------------------- |
| `OnModuleInit`              | `onModuleInit()`                    | After module dependencies are resolved |
| `OnApplicationBootstrap`    | `onApplicationBootstrap()`          | After all modules initialized          |
| `OnModuleDestroy`           | `onModuleDestroy()`                 | When shutdown signal received          |
| `BeforeApplicationShutdown` | `beforeApplicationShutdown(signal)` | Before listeners stop                  |
| `OnApplicationShutdown`     | `onApplicationShutdown(signal)`     | After listeners stopped                |

### Classes

| Class               | Description                                    |
| ------------------- | ---------------------------------------------- |
| `ModuleFactory`     | Bootstraps the application and manages modules |
| `ApplicationLogger` | NestJS-style logger for use in services        |

### Plugin Functions

| Function                 | Description                                       |
| ------------------------ | ------------------------------------------------- |
| `registerOpenAPI`        | Register OpenAPI/Swagger documentation            |
| `registerOpenTelemetry`  | Register OpenTelemetry tracing                    |
| `registerAxiomTelemetry` | Register OpenTelemetry with Axiom backend         |
| `getCurrentSpan`         | Get current OpenTelemetry span for custom attrs   |
| `createOpenAPIDetail`    | Helper to create OpenAPI route details            |
| `SecuritySchemes`        | Pre-configured security schemes (Bearer, API Key) |

## Requirements

- Bun >= 1.3
- Zod >= 3.24
- TypeScript >= 5.0
- ElysiaJS >= 1.4

## License

MIT © 2024

## Contributing

Contributions are welcome! Please read our [Contributing Guide](./CONTRIBUTING.md) for details.

## Acknowledgements

- Inspired by [NestJS](https://nestjs.com)
- Built on top of [ElysiaJS](https://elysiajs.com)
- DI powered by [TSyringe](https://github.com/microsoft/tsyringe)

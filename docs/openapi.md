# OpenAPI Integration

ElysiaJS-DI provides seamless integration with `@elysiajs/openapi` for automatic API documentation generation.

## Installation

```bash
bun add @elysiajs/openapi
```

## Basic Setup

```typescript
import { Elysia } from "elysia";
import { ModuleFactory, registerOpenAPI } from "@igorcesarcode/elysiajs-di";
import { AppModule } from "./app.module";

const app = new Elysia();
const factory = new ModuleFactory();

// Bootstrap your application
await factory.bootstrap(AppModule, app);

// Register OpenAPI documentation
await registerOpenAPI(app, {
  path: "/swagger",
  documentation: {
    info: {
      title: "My API",
      version: "1.0.0",
      description: "API Documentation",
    },
  },
});

app.listen(3000, () => {
  console.log("🚀 Server running at http://localhost:3000");
  console.log("📚 Swagger UI at http://localhost:3000/swagger");
});
```

## Configuration Options

```typescript
interface OpenAPIConfig {
  // Path where Swagger UI will be served
  path?: string; // default: '/swagger'

  // OpenAPI specification version
  version?: string; // default: '3.1.0'

  // API documentation info
  documentation?: {
    info?: {
      title?: string;
      description?: string;
      version?: string;
      contact?: {
        name?: string;
        email?: string;
        url?: string;
      };
      license?: {
        name?: string;
        url?: string;
      };
    };
    servers?: Array<{
      url: string;
      description?: string;
    }>;
    tags?: Array<{
      name: string;
      description?: string;
    }>;
    components?: {
      securitySchemes?: Record<string, SecurityScheme>;
    };
  };

  // Exclude paths from documentation
  exclude?: string[] | RegExp[];
}
```

## Adding Tags to Routes

Organize your API endpoints using tags:

```typescript
import { Controller, Get, Post } from "@igorcesarcode/elysiajs-di";

@Controller("/users")
export class UserController {
  @Get("/", {
    detail: {
      tags: ["Users"],
      summary: "Get all users",
      description: "Returns a list of all registered users",
    },
  })
  getAllUsers() {
    return this.userService.findAll();
  }

  @Post("/", {
    detail: {
      tags: ["Users"],
      summary: "Create a new user",
    },
  })
  createUser({ body }) {
    return this.userService.create(body);
  }
}
```

## Security Schemes

### JWT Bearer Authentication

```typescript
import { registerOpenAPI, SecuritySchemes } from '@igorcesarcode/elysiajs-di'

await registerOpenAPI(app, {
  documentation: {
    components: {
      securitySchemes: {
        bearerAuth: SecuritySchemes.bearerAuth
      }
    }
  }
})

// Apply to routes
@Get('/profile', {
  detail: {
    security: [{ bearerAuth: [] }]
  }
})
getProfile() {
  // Protected route
}
```

### API Key Authentication

```typescript
await registerOpenAPI(app, {
  documentation: {
    components: {
      securitySchemes: {
        apiKey: SecuritySchemes.apiKeyHeader("X-API-Key"),
      },
    },
  },
});
```

### Basic Authentication

```typescript
await registerOpenAPI(app, {
  documentation: {
    components: {
      securitySchemes: {
        basicAuth: SecuritySchemes.basicAuth,
      },
    },
  },
});
```

## Hiding Routes

Hide specific routes from the documentation:

```typescript
@Post('/internal-endpoint', {
  detail: {
    hide: true
  }
})
internalEndpoint() {
  // This won't appear in Swagger UI
}
```

## Multiple Servers

```typescript
await registerOpenAPI(app, {
  documentation: {
    servers: [
      { url: "http://localhost:3000", description: "Development" },
      { url: "https://staging-api.example.com", description: "Staging" },
      { url: "https://api.example.com", description: "Production" },
    ],
  },
});
```

## Complete Example

```typescript
import { Elysia } from "elysia";
import { z } from "zod";
import {
  Module,
  Controller,
  Get,
  Post,
  Singleton,
  ModuleFactory,
  registerOpenAPI,
  SecuritySchemes,
} from "@igorcesarcode/elysiajs-di";

// Schemas
const CreateUserSchema = z.object({
  name: z.string().min(2),
  email: z.string().email(),
});

// Service
@Singleton()
class UserService {
  private users = [{ id: 1, name: "John", email: "john@example.com" }];

  findAll() {
    return this.users;
  }
  create(data: any) {
    const user = { id: Date.now(), ...data };
    this.users.push(user);
    return user;
  }
}

// Controller with OpenAPI details
@Controller("/users")
class UserController {
  constructor(private userService: UserService) {}

  @Get("/", {
    detail: {
      tags: ["Users"],
      summary: "List all users",
      description: "Returns all registered users in the system",
    },
  })
  findAll() {
    return this.userService.findAll();
  }

  @Post("/", {
    body: CreateUserSchema,
    detail: {
      tags: ["Users"],
      summary: "Create user",
      description: "Creates a new user account",
    },
  })
  create({ body }) {
    return this.userService.create(body);
  }
}

// Module
@Module({
  controllers: [UserController],
  providers: [UserService],
})
class UserModule {}

@Module({ imports: [UserModule] })
class AppModule {}

// Bootstrap
const app = new Elysia();
const factory = new ModuleFactory();

await factory.bootstrap(AppModule, app);

await registerOpenAPI(app, {
  path: "/docs",
  documentation: {
    info: {
      title: "User Management API",
      version: "1.0.0",
      description: "API for managing users",
      contact: {
        name: "API Support",
        email: "support@example.com",
      },
    },
    tags: [{ name: "Users", description: "User management endpoints" }],
    components: {
      securitySchemes: {
        bearerAuth: SecuritySchemes.bearerAuth,
      },
    },
  },
});

app.listen(3000);
```

## Troubleshooting

### Plugin not found

```
Failed to load @elysiajs/openapi
```

**Solution:** Install the package:

```bash
bun add @elysiajs/openapi
```

### Swagger UI not showing routes

Make sure `registerOpenAPI` is called **after** `factory.bootstrap()` to ensure all routes are registered.

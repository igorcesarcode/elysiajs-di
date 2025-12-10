# Guards

Guards are a powerful feature in ElysiaJS-DI that allow you to protect routes and control access based on custom logic. They are executed before the route handler and can prevent access or modify the request context.

## Overview

Guards in ElysiaJS-DI work similarly to NestJS guards. They implement the `CanActivate` interface and are executed before route handlers. Guards can:

- Allow or deny access to routes
- Modify the execution context
- Attach data to the context for use in route handlers
- Perform authentication and authorization checks

## Basic Usage

### Creating a Guard

To create a guard, implement the `CanActivate` interface:

```typescript
import type { CanActivate, ExecutionContext } from "@igorcesarcode/elysiajs-di";
import { Injectable } from "@igorcesarcode/elysiajs-di";

@Injectable()
export class AuthGuard implements CanActivate {
  async canActivate(executionContext: ExecutionContext): Promise<boolean> {
    const { context } = executionContext;

    // Your guard logic here
    // Return true to allow access, false to deny
    return true;
  }
}
```

### Using Guards on Routes

Apply guards to routes using the `@UseGuards()` decorator:

```typescript
import { Controller, Get, UseGuards } from "@igorcesarcode/elysiajs-di";
import { AuthGuard } from "./auth.guard";

@Controller("/users")
export class UserController {
  @UseGuards(AuthGuard)
  @Get("/profile")
  getProfile() {
    return { message: "Protected route" };
  }
}
```

### Multiple Guards

You can apply multiple guards to a single route. They are executed in order:

```typescript
@UseGuards(AuthGuard, RoleGuard, PermissionGuard)
@Get('/admin')
getAdminData() {
  return { message: 'Admin only' }
}
```

## Execution Context

The `ExecutionContext` provides access to:

- **context**: The Elysia request context (params, query, body, headers, request, set)
- **handler**: The handler method name
- **controller**: The controller class constructor
- **controllerInstance**: The controller instance
- **data**: Object to attach data for route handlers

```typescript
async canActivate(executionContext: ExecutionContext): Promise<boolean> {
  const { context, handler, controller, controllerInstance, data } = executionContext

  // Access request data
  const headers = context.headers
  const params = context.params
  const body = context.body

  // Attach data for route handler
  if (!data) {
    data = {}
  }
  data.user = { id: 1, name: 'John' }

  return true
}
```

## Example: Authentication Guard

Here's a complete example of an authentication guard using JWT:

```typescript
import type { CanActivate, ExecutionContext } from "@igorcesarcode/elysiajs-di";
import { Injectable, JwtService } from "@igorcesarcode/elysiajs-di";
import { AuthService } from "./auth.service";

@Injectable()
export class AuthGuard implements CanActivate {
  constructor(
    private jwtService: JwtService,
    private authService: AuthService
  ) {}

  async canActivate(executionContext: ExecutionContext): Promise<boolean> {
    const { context } = executionContext;

    // Extract token from Authorization header
    const token = this.jwtService.extractTokenFromContext(context);

    if (!token) {
      context.set.status = 401;
      return false;
    }

    try {
      // Verify token using JWT plugin from context
      const payload = await this.jwtService.verifyFromContext(context);

      if (!payload || typeof payload !== "object" || !("userId" in payload)) {
        context.set.status = 401;
        return false;
      }

      // Get user from database
      const user = await this.authService.findById(
        (payload as { userId: number }).userId
      );

      if (!user) {
        context.set.status = 401;
        return false;
      }

      // Attach user and payload to context for handler access
      if (!executionContext.data) {
        executionContext.data = {};
      }

      executionContext.data.user = user;
      executionContext.data.jwt = payload;

      // Also attach to Elysia context for convenience
      (context as { user?: unknown; jwt?: unknown }).user = user;
      (context as { user?: unknown; jwt?: unknown }).jwt = payload;

      return true;
    } catch (error) {
      context.set.status = 401;
      return false;
    }
  }
}
```

## Example: Role-Based Guard

Here's an example of a role-based authorization guard:

```typescript
import type { CanActivate, ExecutionContext } from "@igorcesarcode/elysiajs-di";
import { Injectable } from "@igorcesarcode/elysiajs-di";

@Injectable()
export class RoleGuard implements CanActivate {
  constructor(private requiredRole: string) {}

  async canActivate(executionContext: ExecutionContext): Promise<boolean> {
    const { context, data } = executionContext;

    // Get user from context (set by AuthGuard)
    const user = (data?.user || context.user) as { role?: string } | undefined;

    if (!user || user.role !== this.requiredRole) {
      context.set.status = 403;
      return false;
    }

    return true;
  }
}
```

## Accessing Guard Data in Handlers

Data attached by guards is available in route handlers:

```typescript
@UseGuards(AuthGuard)
@Get('/profile')
getProfile({ user, jwt }: any) {
  // user and jwt are attached by AuthGuard
  return {
    user,
    tokenData: jwt
  }
}
```

## Error Handling

Guards should set appropriate HTTP status codes:

- **401 Unauthorized**: Authentication failed
- **403 Forbidden**: Authorization failed (user authenticated but lacks permission)
- **500 Internal Server Error**: Server configuration error

```typescript
if (!token) {
  context.set.status = 401;
  return false;
}

if (!hasPermission) {
  context.set.status = 403;
  return false;
}
```

## Best Practices

1. **Keep guards focused**: Each guard should have a single responsibility
2. **Use dependency injection**: Inject services into guards for reusability
3. **Set appropriate status codes**: Use 401 for authentication, 403 for authorization
4. **Attach data to context**: Use `executionContext.data` to pass data to handlers
5. **Handle errors gracefully**: Catch errors and return appropriate responses
6. **Order matters**: Guards execute in the order they are applied

## Integration with JWT

Guards work seamlessly with the JWT plugin. The `JwtService` provides helper methods:

- `extractTokenFromContext(context)`: Extract token from Elysia context
- `verifyFromContext(context)`: Verify token using JWT plugin from context

See the [JWT Service documentation](./jwt-service.md) for more details.

## Troubleshooting

If you encounter issues with guards, see the [Troubleshooting Guide](./troubleshooting-auth-guard.md).

Common issues:

- Guards not executing: Ensure guards are registered as providers
- JWT plugin not available: Ensure JWT plugin is registered in module
- Headers not accessible: Use `JwtService.extractTokenFromContext()` for proper header reading

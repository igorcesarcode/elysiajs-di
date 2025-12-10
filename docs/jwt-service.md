# JWT Service

The `JwtService` provides a convenient wrapper around the `@elysiajs/jwt` plugin for signing and verifying JWT tokens in your ElysiaJS-DI application.

## Overview

The `JwtService` simplifies JWT token management by:

- Extracting tokens from request headers
- Signing tokens with payload data
- Verifying tokens and extracting payloads
- Handling multiple header sources in ElysiaJS context

## Installation

First, ensure you have the JWT plugin installed:

```bash
bun add @elysiajs/jwt
```

## Configuration

Register the JWT plugin in your module:

```typescript
import { Module } from '@igorcesarcode/elysiajs-di'

@Module({
  controllers: [AuthController],
  providers: [AuthService, AuthGuard, JwtService],
  plugins: {
    jwt: {
      secret: process.env.JWT_SECRET || 'your-secret-key',
      name: 'jwt' // Optional, defaults to 'jwt'
    }
  }
})
export class AuthModule {}
```

## Basic Usage

### Injecting JwtService

```typescript
import { Injectable, JwtService } from '@igorcesarcode/elysiajs-di'

@Injectable()
export class AuthController {
  constructor(private jwtService: JwtService) { }
}
```

### Signing Tokens

Sign a JWT token with user data:

```typescript
async login({ body, jwt }: any) {
  const user = await this.authService.authenticate(body.email, body.password)

  if (!user) {
    return { error: 'Invalid credentials' }
  }

  // Sign JWT token with user data
  const token = await this.jwtService.sign({
    userId: user.id,
    email: user.email,
    name: user.name
  }, { jwt })

  return {
    success: true,
    token,
    user
  }
}
```

### Verifying Tokens

Verify a token in a guard:

```typescript
import type { CanActivate, ExecutionContext } from '@igorcesarcode/elysiajs-di'
import { Injectable, JwtService } from '@igorcesarcode/elysiajs-di'

@Injectable()
export class AuthGuard implements CanActivate {
  constructor(private jwtService: JwtService) { }

  async canActivate(executionContext: ExecutionContext): Promise<boolean> {
    const { context } = executionContext

    // Extract and verify token
    const payload = await this.jwtService.verifyFromContext(context)

    if (!payload) {
      context.set.status = 401
      return false
    }

    // Use payload data
    const userId = (payload as { userId: number }).userId
    // ...

    return true
  }
}
```

## API Reference

### `sign(payload, context)`

Signs a JWT token with the given payload.

**Parameters:**
- `payload: Record<string, unknown>` - Data to encode in the token
- `context: { [key: string]: unknown }` - Elysia context (must have JWT plugin)

**Returns:** `Promise<string>` - Signed JWT token

**Throws:** Error if JWT plugin is not available in context

**Example:**
```typescript
const token = await jwtService.sign(
  { userId: 1, email: 'user@example.com' },
  { jwt }
)
```

### `verify(token, context)`

Verifies and decodes a JWT token.

**Parameters:**
- `token: string` - JWT token to verify
- `context: { [key: string]: unknown }` - Elysia context (must have JWT plugin)

**Returns:** `Promise<unknown | null>` - Decoded payload if valid, null if invalid

**Example:**
```typescript
const payload = await jwtService.verify(token, context)
if (payload) {
  const userId = (payload as { userId: number }).userId
}
```

### `verifyFromContext(context)`

Convenience method that extracts and verifies token from context.

**Parameters:**
- `context: { [key: string]: unknown }` - Elysia context

**Returns:** `Promise<unknown | null>` - Decoded payload if valid, null if invalid

**Example:**
```typescript
const payload = await jwtService.verifyFromContext(context)
```

### `extractToken(headers)`

Extracts token from Authorization header.

**Parameters:**
- `headers: Record<string, string | undefined>` - Request headers

**Returns:** `string | null` - Token if found, null otherwise

**Example:**
```typescript
const token = jwtService.extractToken(headers)
```

### `extractTokenFromContext(context)`

Extracts token from Elysia context, handling multiple header sources.

**Parameters:**
- `context: { headers?: Record<string, string | undefined>, request?: Request, [key: string]: unknown }` - Elysia context

**Returns:** `string | null` - Token if found, null otherwise

**Example:**
```typescript
const token = jwtService.extractTokenFromContext(context)
```

## Header Extraction

The `extractTokenFromContext` method handles multiple header sources in ElysiaJS:

1. `context.headers` - Simple key-value object
2. `context.request.headers` - Native Request headers
3. Headers object with `get()` method

This ensures tokens are found regardless of how ElysiaJS provides headers.

## Security Considerations

### Bearer Token Validation

The service validates that the Authorization header starts with "Bearer":

```typescript
// ✅ Valid
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

// ❌ Invalid (rejected)
Authorization: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

### Secret Key Management

Always use environment variables for JWT secrets:

```typescript
plugins: {
  jwt: {
    secret: process.env.JWT_SECRET || 'fallback-secret'
  }
}
```

Never commit secrets to version control.

## Complete Example

Here's a complete authentication flow using JwtService:

```typescript
// auth.controller.ts
import { Controller, Post, Get, UseGuards, JwtService } from '@igorcesarcode/elysiajs-di'
import { AuthService } from './auth.service'
import { AuthGuard } from './auth.guard'

@Controller('/auth')
export class AuthController {
  constructor(
    private authService: AuthService,
    private jwtService: JwtService
  ) { }

  @Post('/login')
  async login({ body, jwt }: any) {
    const user = await this.authService.authenticate(body.email, body.password)

    if (!user) {
      return { error: 'Invalid credentials' }
    }

    const token = await this.jwtService.sign({
      userId: user.id,
      email: user.email
    }, { jwt })

    return { token, user }
  }

  @UseGuards(AuthGuard)
  @Get('/profile')
  async getProfile({ user, jwt }: any) {
    return { user, tokenData: jwt }
  }
}
```

```typescript
// auth.guard.ts
import type { CanActivate, ExecutionContext } from '@igorcesarcode/elysiajs-di'
import { Injectable, JwtService } from '@igorcesarcode/elysiajs-di'

@Injectable()
export class AuthGuard implements CanActivate {
  constructor(private jwtService: JwtService) { }

  async canActivate(executionContext: ExecutionContext): Promise<boolean> {
    const { context } = executionContext

    const payload = await this.jwtService.verifyFromContext(context)

    if (!payload || typeof payload !== 'object' || !('userId' in payload)) {
      context.set.status = 401
      return false
    }

    // Attach payload to context
    if (!executionContext.data) {
      executionContext.data = {}
    }
    executionContext.data.jwt = payload
    ; (context as { jwt?: unknown }).jwt = payload

    return true
  }
}
```

## Troubleshooting

If you encounter issues, see the [Troubleshooting Guide](./troubleshooting-auth-guard.md).

Common issues:
- **JWT plugin not found**: Ensure JWT plugin is registered in module
- **Token extraction fails**: Use `extractTokenFromContext()` instead of `extractToken()`
- **Headers not accessible**: The service handles multiple header sources automatically


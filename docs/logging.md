# Logging

ElysiaJS-DI provides a NestJS-style logging system with colored output and structured formatting.

## Overview

The library includes two loggers:

1. **ApplicationLogger** - For use in your services and controllers
2. **InternalLogger** - Used internally by the framework

## ApplicationLogger

Use `ApplicationLogger` in your services and controllers:

```typescript
import { Singleton, ApplicationLogger } from '@igorcesarcode/elysiajs-di'

@Singleton()
class UserService {
  private readonly logger = new ApplicationLogger(UserService.name)

  findAll() {
    this.logger.log('Fetching all users')
    return []
  }
}
```

## Log Levels

### log() - Standard Log

For general information:

```typescript
this.logger.log('User created successfully')
// [Elysia] 12345  - 12/09/2025 - 05:30 PM     LOG   [UserService] User created successfully
```

### warn() - Warning

For non-critical issues:

```typescript
this.logger.warn('Cache miss for user data')
// [Elysia] 12345  - 12/09/2025 - 05:30 PM     WARN  [UserService] Cache miss for user data
```

### error() - Error

For errors and exceptions:

```typescript
this.logger.error('Failed to connect to database')
// [Elysia] 12345  - 12/09/2025 - 05:30 PM     ERROR [UserService] Failed to connect to database
```

### debug() - Debug

For debugging information:

```typescript
this.logger.debug('Query executed in 15ms')
// [Elysia] 12345  - 12/09/2025 - 05:30 PM     DEBUG [UserService] Query executed in 15ms
```

### verbose() - Verbose

For detailed tracing:

```typescript
this.logger.verbose('Processing request payload')
// [Elysia] 12345  - 12/09/2025 - 05:30 PM     VERBOSE [UserService] Processing request payload
```

## Output Format

The log format follows NestJS conventions:

```
[AppName] PID  - MM/DD/YYYY - HH:MM AM/PM     LEVEL [Context] Message
```

Example:
```
[Elysia] 12345  - 12/09/2025 - 05:30 PM     LOG   [UserService] Fetching all users
```

## Colors

In terminals that support ANSI colors:

| Level | Color |
|-------|-------|
| LOG | Green |
| WARN | Yellow |
| ERROR | Red |
| DEBUG | Magenta |
| VERBOSE | Cyan |

## Logging with Data

Pass additional data to log methods:

```typescript
this.logger.log('User created', { userId: 123, email: 'user@example.com' })
// [Elysia] 12345  - ... LOG [UserService] User created {"userId":123,"email":"user@example.com"}

this.logger.error('Request failed', { statusCode: 500, path: '/api/users' })
// [Elysia] 12345  - ... ERROR [UserService] Request failed {"statusCode":500,"path":"/api/users"}
```

## Best Practices

### 1. Use Descriptive Context Names

```typescript
// ✅ Good - use class name
private readonly logger = new ApplicationLogger(UserService.name)

// ❌ Bad - generic name
private readonly logger = new ApplicationLogger('Service')
```

### 2. Log at Appropriate Levels

```typescript
// ✅ Good - appropriate levels
this.logger.log('User registered')           // Normal operation
this.logger.warn('Rate limit approaching')   // Potential issue
this.logger.error('Database connection lost') // Error

// ❌ Bad - wrong levels
this.logger.error('User logged in')  // Not an error
this.logger.log('Critical failure')  // Should be error
```

### 3. Include Relevant Context

```typescript
// ✅ Good - includes context
this.logger.log(`User ${userId} updated their profile`)
this.logger.error(`Failed to process order ${orderId}: ${error.message}`)

// ❌ Bad - no context
this.logger.log('Updated')
this.logger.error('Failed')
```

### 4. Avoid Sensitive Data

```typescript
// ✅ Good - no sensitive data
this.logger.log(`User ${userId} authenticated`)

// ❌ Bad - logs password
this.logger.log(`User login: ${email}, password: ${password}`)
```

### 5. Use Structured Logging for Complex Data

```typescript
// ✅ Good - structured data
this.logger.log('Request processed', {
  method: 'POST',
  path: '/api/users',
  duration: 45,
  statusCode: 201
})
```

## Framework Logs

The framework automatically logs:

### Application Startup

```
[Elysia] 12345  - 12/09/2025 - 05:30 PM     LOG   [ElysiaFactory] Starting Elysia application... +0ms
[Elysia] 12345  - 12/09/2025 - 05:30 PM     LOG   [InstanceLoader] UserModule dependencies initialized +5ms
[Elysia] 12345  - 12/09/2025 - 05:30 PM     LOG   [RoutesResolver] UserController {/users}: +0ms
[Elysia] 12345  - 12/09/2025 - 05:30 PM     LOG   [RouterExplorer] Mapped {/users, GET} route +0ms
[Elysia] 12345  - 12/09/2025 - 05:30 PM     LOG   [ElysiaApplication] Elysia application successfully started +0ms
```

### Validation Errors

```
[Elysia] 12345  - 12/09/2025 - 05:30 PM     ERROR [ValidationPipe] Validation failed - email: Invalid email format +0ms
```

### 404 Not Found

```
[Elysia] 12345  - 12/09/2025 - 05:30 PM     WARN  [RouterExplorer] Route not found: GET /unknown +0ms
```

### Application Shutdown

```
[Elysia] 12345  - 12/09/2025 - 05:30 PM     WARN  [ElysiaApplication] Received SIGINT, starting graceful shutdown... +0ms
[Elysia] 12345  - 12/09/2025 - 05:30 PM     LOG   [InstanceDestroyer] UserService instance destroyed +0ms
[Elysia] 12345  - 12/09/2025 - 05:30 PM     LOG   [ElysiaApplication] Graceful shutdown completed +0ms
```

## Complete Example

```typescript
import { Singleton, ApplicationLogger, OnModuleInit } from '@igorcesarcode/elysiajs-di'

@Singleton()
export class UserService implements OnModuleInit {
  private readonly logger = new ApplicationLogger(UserService.name)
  private users: User[] = []

  async onModuleInit() {
    this.logger.log('Initializing UserService')
    await this.loadInitialData()
    this.logger.log(`Loaded ${this.users.length} users`)
  }

  async findAll(): Promise<User[]> {
    this.logger.log('Fetching all users')
    return this.users
  }

  async findById(id: number): Promise<User | null> {
    this.logger.log(`Fetching user with ID: ${id}`)
    
    const user = this.users.find(u => u.id === id)
    
    if (!user) {
      this.logger.warn(`User with ID ${id} not found`)
      return null
    }
    
    return user
  }

  async create(data: CreateUserDto): Promise<User> {
    this.logger.log(`Creating user: ${data.email}`)
    
    try {
      const user = { id: Date.now(), ...data }
      this.users.push(user)
      
      this.logger.log(`User created successfully`, { userId: user.id })
      return user
    } catch (error) {
      this.logger.error(`Failed to create user: ${error.message}`)
      throw error
    }
  }

  async delete(id: number): Promise<boolean> {
    this.logger.log(`Deleting user with ID: ${id}`)
    
    const index = this.users.findIndex(u => u.id === id)
    
    if (index === -1) {
      this.logger.warn(`Cannot delete: User ${id} not found`)
      return false
    }
    
    this.users.splice(index, 1)
    this.logger.log(`User ${id} deleted successfully`)
    return true
  }

  private async loadInitialData() {
    this.logger.debug('Loading initial user data from seed')
    // Load data...
  }
}
```

Output:
```
[Elysia] 12345  - 12/09/2025 - 05:30 PM     LOG   [UserService] Initializing UserService
[Elysia] 12345  - 12/09/2025 - 05:30 PM     DEBUG [UserService] Loading initial user data from seed
[Elysia] 12345  - 12/09/2025 - 05:30 PM     LOG   [UserService] Loaded 3 users
[Elysia] 12345  - 12/09/2025 - 05:30 PM     LOG   [UserService] Fetching all users
[Elysia] 12345  - 12/09/2025 - 05:30 PM     LOG   [UserService] Creating user: john@example.com
[Elysia] 12345  - 12/09/2025 - 05:30 PM     LOG   [UserService] User created successfully {"userId":1702147800000}
[Elysia] 12345  - 12/09/2025 - 05:30 PM     LOG   [UserService] Fetching user with ID: 999
[Elysia] 12345  - 12/09/2025 - 05:30 PM     WARN  [UserService] User with ID 999 not found
```


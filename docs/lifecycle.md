# Lifecycle Hooks

Lifecycle hooks allow you to tap into key moments in the application's lifecycle, such as initialization and shutdown.

## Overview

ElysiaJS-DI provides lifecycle hooks similar to NestJS:

```
┌─────────────────────────────────────────────────────────────┐
│                    APPLICATION LIFECYCLE                     │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  BOOTSTRAP PHASE                                            │
│  ┌─────────────────────────────────────────────────────┐   │
│  │ 1. Register all modules, controllers, providers      │   │
│  │ 2. Resolve dependencies                              │   │
│  │ 3. Call onModuleInit() on all instances             │   │
│  │ 4. Call onApplicationBootstrap() on all instances   │   │
│  │ 5. Start HTTP listeners                              │   │
│  └─────────────────────────────────────────────────────┘   │
│                           ↓                                 │
│                  APPLICATION RUNNING                        │
│                           ↓                                 │
│  SHUTDOWN PHASE (on SIGINT/SIGTERM)                        │
│  ┌─────────────────────────────────────────────────────┐   │
│  │ 1. Call onModuleDestroy() on all instances          │   │
│  │ 2. Call beforeApplicationShutdown() on all instances│   │
│  │ 3. Stop HTTP listeners                               │   │
│  │ 4. Call onApplicationShutdown() on all instances    │   │
│  │ 5. Process exits                                     │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

## Available Hooks

### OnModuleInit

Called after the module's dependencies have been resolved.

```typescript
import { Singleton, OnModuleInit } from 'elysiajs-di'

@Singleton()
class DatabaseService implements OnModuleInit {
  private connection: Database | null = null

  async onModuleInit() {
    console.log('Connecting to database...')
    this.connection = await Database.connect()
    console.log('Database connected!')
  }
}
```

**Use cases:**
- Establishing database connections
- Loading configuration
- Initializing caches
- Setting up event listeners

### OnApplicationBootstrap

Called after all modules have been initialized, just before the application starts listening.

```typescript
import { Singleton, OnApplicationBootstrap } from 'elysiajs-di'

@Singleton()
class AppService implements OnApplicationBootstrap {
  async onApplicationBootstrap() {
    console.log('Application is ready to receive requests')
    // Perform any final setup
  }
}
```

**Use cases:**
- Final health checks
- Warming up caches
- Registering with service discovery
- Starting background jobs

### OnModuleDestroy

Called when the application receives a termination signal.

```typescript
import { Singleton, OnModuleDestroy } from 'elysiajs-di'

@Singleton()
class CacheService implements OnModuleDestroy {
  async onModuleDestroy() {
    console.log('Flushing cache...')
    await this.flush()
    console.log('Cache flushed!')
  }
}
```

**Use cases:**
- Flushing caches
- Completing pending operations
- Sending final metrics

### BeforeApplicationShutdown

Called after `onModuleDestroy` but before listeners are stopped.

```typescript
import { Singleton, BeforeApplicationShutdown } from 'elysiajs-di'

@Singleton()
class GracefulShutdown implements BeforeApplicationShutdown {
  async beforeApplicationShutdown(signal?: string) {
    console.log(`Received signal: ${signal}`)
    console.log('Waiting for pending requests to complete...')
    await this.waitForPendingRequests()
  }
}
```

**Use cases:**
- Draining connection pools
- Waiting for pending requests
- Deregistering from load balancers

### OnApplicationShutdown

Called after listeners have stopped, just before the process exits.

```typescript
import { Singleton, OnApplicationShutdown } from 'elysiajs-di'

@Singleton()
class DatabaseService implements OnApplicationShutdown {
  async onApplicationShutdown(signal?: string) {
    console.log(`Shutting down due to ${signal}`)
    await this.connection.close()
    console.log('Database connection closed')
  }
}
```

**Use cases:**
- Closing database connections
- Closing file handles
- Final cleanup

## Implementing Hooks

### Single Hook

Implement a single interface:

```typescript
@Singleton()
class MyService implements OnModuleInit {
  async onModuleInit() {
    // Initialization logic
  }
}
```

### Multiple Hooks

Implement multiple interfaces:

```typescript
@Singleton()
class DatabaseService implements 
  OnModuleInit, 
  OnApplicationBootstrap,
  OnModuleDestroy,
  OnApplicationShutdown 
{
  async onModuleInit() {
    await this.connect()
  }

  async onApplicationBootstrap() {
    await this.runMigrations()
  }

  async onModuleDestroy() {
    await this.flushPendingWrites()
  }

  async onApplicationShutdown(signal?: string) {
    await this.disconnect()
  }
}
```

## Complete Example

```typescript
import {
  Singleton,
  ApplicationLogger,
  OnModuleInit,
  OnApplicationBootstrap,
  OnModuleDestroy,
  BeforeApplicationShutdown,
  OnApplicationShutdown
} from 'elysiajs-di'

@Singleton()
export class AppLifecycleService implements
  OnModuleInit,
  OnApplicationBootstrap,
  OnModuleDestroy,
  BeforeApplicationShutdown,
  OnApplicationShutdown
{
  private readonly logger = new ApplicationLogger(AppLifecycleService.name)
  private startTime: number = 0

  async onModuleInit() {
    this.startTime = Date.now()
    this.logger.log('Module initialized')
    
    // Initialize resources
    await this.initializeResources()
  }

  async onApplicationBootstrap() {
    this.logger.log('Application bootstrap completed')
    this.logger.log('Ready to accept connections')
  }

  async onModuleDestroy() {
    this.logger.warn('Module destruction started')
    
    // Start cleanup
    await this.beginCleanup()
  }

  async beforeApplicationShutdown(signal?: string) {
    this.logger.warn(`Shutdown signal received: ${signal}`)
    this.logger.log('Waiting for pending operations...')
    
    // Wait for pending work
    await this.waitForPendingOperations()
  }

  async onApplicationShutdown(signal?: string) {
    const uptime = Math.round((Date.now() - this.startTime) / 1000)
    this.logger.log(`Application shutdown complete`)
    this.logger.log(`Total uptime: ${uptime} seconds`)
    
    // Final cleanup
    await this.finalCleanup()
  }

  private async initializeResources() {
    // Initialization logic
  }

  private async beginCleanup() {
    // Cleanup logic
  }

  private async waitForPendingOperations() {
    // Wait for pending work
  }

  private async finalCleanup() {
    // Final cleanup
  }
}
```

## Execution Order

Hooks are called in the following order:

### Bootstrap Phase

1. All modules are registered
2. All providers are instantiated
3. `onModuleInit()` is called on all instances (in registration order)
4. `onApplicationBootstrap()` is called on all instances

### Shutdown Phase

1. Signal received (SIGINT or SIGTERM)
2. `onModuleDestroy()` is called on all instances
3. `beforeApplicationShutdown(signal)` is called on all instances
4. HTTP listeners are stopped
5. `onApplicationShutdown(signal)` is called on all instances
6. Process exits

## Best Practices

### 1. Handle Errors

Always handle errors in lifecycle hooks:

```typescript
async onModuleInit() {
  try {
    await this.connect()
  } catch (error) {
    this.logger.error(`Failed to initialize: ${error.message}`)
    throw error // Prevents application from starting
  }
}
```

### 2. Implement Timeouts

Add timeouts for potentially slow operations:

```typescript
async onApplicationShutdown() {
  const timeout = setTimeout(() => {
    this.logger.error('Shutdown timeout - forcing exit')
    process.exit(1)
  }, 10000)

  try {
    await this.cleanup()
  } finally {
    clearTimeout(timeout)
  }
}
```

### 3. Use Async/Await

Always use async/await for async operations:

```typescript
// ✅ Good
async onModuleInit() {
  await this.database.connect()
}

// ❌ Bad - won't wait for connection
onModuleInit() {
  this.database.connect()
}
```

### 4. Log Important Events

Log lifecycle events for debugging:

```typescript
async onModuleInit() {
  this.logger.log('Starting initialization...')
  await this.initialize()
  this.logger.log('Initialization complete')
}
```


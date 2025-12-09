# Providers

Providers are classes that can be injected as dependencies. They encapsulate business logic, data access, and other reusable functionality.

## Overview

A provider is any class that can be injected through the dependency injection system:

```typescript
@Singleton()
class UserService {
  findAll() {
    return []
  }
}
```

## Provider Decorators

### @Singleton()

Creates a single shared instance across the entire application:

```typescript
@Singleton()
class DatabaseService {
  private connection: Database

  async connect() {
    this.connection = await Database.connect()
  }
}
```

**Use Singleton for:**
- Database connections
- Configuration services
- Caching services
- Logging services
- Any stateful service that should be shared

### @Injectable()

Creates a new instance for each injection:

```typescript
@Injectable()
class RequestLogger {
  private requestId = crypto.randomUUID()

  log(message: string) {
    console.log(`[${this.requestId}] ${message}`)
  }
}
```

**Use Injectable for:**
- Request-scoped services
- Services that need fresh state per use
- Factories that create new instances

## Dependency Injection

### Constructor Injection

Dependencies are injected through the constructor:

```typescript
@Singleton()
class UserService {
  constructor(
    private logger: Logger,
    private database: DatabaseService,
    private cache: CacheService
  ) {}

  async findAll() {
    this.logger.log('Fetching users')
    
    const cached = await this.cache.get('users')
    if (cached) return cached

    const users = await this.database.query('SELECT * FROM users')
    await this.cache.set('users', users)
    
    return users
  }
}
```

### Injection Order

Dependencies are resolved automatically in the correct order:

```typescript
// Logger has no dependencies
@Singleton()
class Logger {}

// Database depends on Logger
@Singleton()
class Database {
  constructor(private logger: Logger) {}
}

// UserService depends on both
@Singleton()
class UserService {
  constructor(
    private logger: Logger,
    private database: Database
  ) {}
}
```

## Provider Registration

### In Modules

Providers must be registered in a module to be available:

```typescript
@Module({
  providers: [
    Logger,
    DatabaseService,
    UserService,
    UserRepository
  ]
})
class UserModule {}
```

### Exporting Providers

To make a provider available to other modules, export it:

```typescript
// shared/logger/logger.module.ts
@Module({
  providers: [Logger],
  exports: [Logger] // Available to importing modules
})
class LoggerModule {}

// user/user.module.ts
@Module({
  imports: [LoggerModule], // Import the module
  providers: [UserService]
})
class UserModule {}

// UserService can now inject Logger
@Singleton()
class UserService {
  constructor(private logger: Logger) {}
}
```

## Service Patterns

### Repository Pattern

Separate data access from business logic:

```typescript
// user.repository.ts
@Singleton()
class UserRepository {
  constructor(private db: DatabaseService) {}

  async findAll(): Promise<User[]> {
    return this.db.query('SELECT * FROM users')
  }

  async findById(id: number): Promise<User | null> {
    return this.db.queryOne('SELECT * FROM users WHERE id = ?', [id])
  }

  async create(data: CreateUserDto): Promise<User> {
    return this.db.insert('users', data)
  }
}

// user.service.ts
@Singleton()
class UserService {
  constructor(
    private userRepository: UserRepository,
    private logger: Logger
  ) {}

  async findAll() {
    this.logger.log('Fetching all users')
    return this.userRepository.findAll()
  }
}
```

### Factory Pattern

Create instances dynamically:

```typescript
@Singleton()
class ConnectionFactory {
  private connections = new Map<string, Connection>()

  create(name: string, config: ConnectionConfig): Connection {
    if (this.connections.has(name)) {
      return this.connections.get(name)!
    }

    const connection = new Connection(config)
    this.connections.set(name, connection)
    return connection
  }
}
```

### Strategy Pattern

Swap implementations based on configuration:

```typescript
// interfaces
interface PaymentProcessor {
  process(amount: number): Promise<void>
}

// implementations
@Singleton()
class StripeProcessor implements PaymentProcessor {
  async process(amount: number) {
    // Stripe implementation
  }
}

@Singleton()
class PayPalProcessor implements PaymentProcessor {
  async process(amount: number) {
    // PayPal implementation
  }
}

// service
@Singleton()
class PaymentService {
  constructor(
    private stripeProcessor: StripeProcessor,
    private paypalProcessor: PayPalProcessor
  ) {}

  getProcessor(type: 'stripe' | 'paypal'): PaymentProcessor {
    return type === 'stripe' ? this.stripeProcessor : this.paypalProcessor
  }
}
```

## Best Practices

### 1. Single Responsibility

Each service should have one clear purpose:

```typescript
// ✅ Good - focused services
@Singleton()
class UserService {
  // Only user-related logic
}

@Singleton()
class EmailService {
  // Only email-related logic
}

@Singleton()
class NotificationService {
  constructor(
    private emailService: EmailService
  ) {}
  // Orchestrates notifications
}
```

### 2. Interface Segregation

Define interfaces for your services:

```typescript
interface IUserService {
  findAll(): Promise<User[]>
  findById(id: number): Promise<User | null>
  create(data: CreateUserDto): Promise<User>
}

@Singleton()
class UserService implements IUserService {
  // Implementation
}
```

### 3. Use ApplicationLogger

Use the built-in logger for consistent output:

```typescript
@Singleton()
class UserService {
  private readonly logger = new ApplicationLogger(UserService.name)

  async findAll() {
    this.logger.log('Fetching all users')
    try {
      const users = await this.repository.findAll()
      this.logger.log(`Found ${users.length} users`)
      return users
    } catch (error) {
      this.logger.error(`Failed to fetch users: ${error.message}`)
      throw error
    }
  }
}
```

### 4. Handle Errors Gracefully

```typescript
@Singleton()
class UserService {
  private readonly logger = new ApplicationLogger(UserService.name)

  async findById(id: number): Promise<User | null> {
    try {
      return await this.repository.findById(id)
    } catch (error) {
      this.logger.error(`Error finding user ${id}: ${error.message}`)
      throw new ServiceError('Failed to find user', error)
    }
  }
}
```

## Complete Example

```typescript
// types/user.types.ts
export interface User {
  id: number
  name: string
  email: string
  createdAt: Date
}

export interface CreateUserDto {
  name: string
  email: string
}

// user.repository.ts
import { Singleton, ApplicationLogger } from 'elysiajs-di'

@Singleton()
export class UserRepository {
  private readonly logger = new ApplicationLogger(UserRepository.name)
  private users: User[] = []

  async findAll(): Promise<User[]> {
    this.logger.log('Repository: Finding all users')
    return this.users
  }

  async findById(id: number): Promise<User | null> {
    this.logger.log(`Repository: Finding user ${id}`)
    return this.users.find(u => u.id === id) || null
  }

  async create(data: CreateUserDto): Promise<User> {
    this.logger.log(`Repository: Creating user ${data.name}`)
    const user: User = {
      id: Date.now(),
      ...data,
      createdAt: new Date()
    }
    this.users.push(user)
    return user
  }

  async delete(id: number): Promise<boolean> {
    this.logger.log(`Repository: Deleting user ${id}`)
    const index = this.users.findIndex(u => u.id === id)
    if (index === -1) return false
    this.users.splice(index, 1)
    return true
  }
}

// user.service.ts
import { Singleton, ApplicationLogger } from 'elysiajs-di'

@Singleton()
export class UserService {
  private readonly logger = new ApplicationLogger(UserService.name)

  constructor(private userRepository: UserRepository) {}

  async findAll(): Promise<User[]> {
    this.logger.log('Service: Fetching all users')
    return this.userRepository.findAll()
  }

  async findById(id: number): Promise<User | null> {
    this.logger.log(`Service: Fetching user ${id}`)
    const user = await this.userRepository.findById(id)
    if (!user) {
      this.logger.warn(`Service: User ${id} not found`)
    }
    return user
  }

  async create(data: CreateUserDto): Promise<User> {
    this.logger.log(`Service: Creating user ${data.name}`)
    return this.userRepository.create(data)
  }

  async delete(id: number): Promise<boolean> {
    this.logger.log(`Service: Deleting user ${id}`)
    return this.userRepository.delete(id)
  }
}
```


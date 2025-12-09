# Getting Started

This guide will help you set up ElysiaJS-DI in your project and create your first module-based application.

## Prerequisites

Before you begin, ensure you have:

- Node.js >= 18
- TypeScript >= 5.0
- An ElysiaJS project

## Installation

### Step 1: Install Dependencies

```bash
bun add reflect-metadata tsyringe zod
```

### Step 2: Configure TypeScript

Update your `tsconfig.json` to enable decorators:

```json
{
  "compilerOptions": {
    "target": "ES2021",
    "module": "ES2022",
    "moduleResolution": "node",
    "experimentalDecorators": true,
    "emitDecoratorMetadata": true,
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true
  }
}
```

### Step 3: Project Structure

Create the following folder structure:

```
src/
├── modules/
│   └── user/
│       ├── user.controller.ts
│       ├── user.service.ts
│       ├── user.module.ts
│       └── index.ts
├── app.module.ts
└── main.ts
lib/
└── elysiajs-di/
    └── ... (library files)
```

## Creating Your First Module

### Step 1: Create a Service

Services contain your business logic and can be injected into controllers.

```typescript
// src/modules/user/user.service.ts
import { Singleton, ApplicationLogger } from '../../lib/elysiajs-di'

interface User {
  id: number
  name: string
  email: string
}

@Singleton()
export class UserService {
  private readonly logger = new ApplicationLogger(UserService.name)
  private users: User[] = []

  findAll(): User[] {
    this.logger.log('Fetching all users')
    return this.users
  }

  findById(id: number): User | undefined {
    this.logger.log(`Fetching user with ID: ${id}`)
    return this.users.find(u => u.id === id)
  }

  create(data: Omit<User, 'id'>): User {
    this.logger.log(`Creating user: ${data.name}`)
    const user = { id: Date.now(), ...data }
    this.users.push(user)
    return user
  }
}
```

### Step 2: Create a Controller

Controllers handle HTTP requests and delegate to services.

```typescript
// src/modules/user/user.controller.ts
import { Controller, Get, Post } from '../../lib/elysiajs-di'
import type { ElysiaContext } from '../../lib/elysiajs-di'
import { UserService } from './user.service'
import { z } from 'zod'

const CreateUserSchema = z.object({
  name: z.string().min(2),
  email: z.string().email()
})

@Controller('/users')
export class UserController {
  constructor(private userService: UserService) {}

  @Get()
  getAllUsers() {
    return this.userService.findAll()
  }

  @Get('/:id')
  getUserById({ params }: ElysiaContext) {
    return this.userService.findById(Number(params.id))
  }

  @Post('/', { body: CreateUserSchema })
  createUser({ body }: ElysiaContext<z.infer<typeof CreateUserSchema>>) {
    return this.userService.create(body)
  }
}
```

### Step 3: Create the Module

Modules group related controllers and services together.

```typescript
// src/modules/user/user.module.ts
import { Module } from '../../lib/elysiajs-di'
import { UserController } from './user.controller'
import { UserService } from './user.service'

@Module({
  controllers: [UserController],
  providers: [UserService],
  exports: [UserService] // Export if other modules need it
})
export class UserModule {}
```

### Step 4: Create a Barrel Export

```typescript
// src/modules/user/index.ts
export * from './user.service'
export * from './user.controller'
export * from './user.module'
```

### Step 5: Create the Root Module

The root module imports all feature modules.

```typescript
// src/app.module.ts
import { Module } from './lib/elysiajs-di'
import { UserModule } from './modules/user'

@Module({
  imports: [UserModule]
})
export class AppModule {}
```

### Step 6: Bootstrap the Application

```typescript
// src/main.ts
import { Elysia } from 'elysia'
import { ModuleFactory } from './lib/elysiajs-di'
import { AppModule } from './app.module'

const app = new Elysia()

const factory = new ModuleFactory()
await factory.bootstrap(AppModule, app)

app.listen(3000, () => {
  console.log('🚀 Server running at http://localhost:3000')
})
```

## Running the Application

```bash
bun run src/main.ts
```

You should see output like:

```
[Elysia] 12345  - 12/09/2025 - 05:30 PM     LOG   [ElysiaFactory] Starting Elysia application... +0ms
[Elysia] 12345  - 12/09/2025 - 05:30 PM     LOG   [RoutesResolver] UserController {/users}: +5ms
[Elysia] 12345  - 12/09/2025 - 05:30 PM     LOG   [RouterExplorer] Mapped {/users, GET} route +0ms
[Elysia] 12345  - 12/09/2025 - 05:30 PM     LOG   [RouterExplorer] Mapped {/users/:id, GET} route +0ms
[Elysia] 12345  - 12/09/2025 - 05:30 PM     LOG   [RouterExplorer] Mapped {/users, POST} route +0ms
[Elysia] 12345  - 12/09/2025 - 05:30 PM     LOG   [InstanceLoader] UserModule dependencies initialized +1ms
[Elysia] 12345  - 12/09/2025 - 05:30 PM     LOG   [InstanceLoader] AppModule dependencies initialized +0ms
[Elysia] 12345  - 12/09/2025 - 05:30 PM     LOG   [ElysiaApplication] Elysia application successfully started +0ms

🚀 Server running at http://localhost:3000
```

## Testing the Endpoints

```bash
# Get all users
curl http://localhost:3000/users

# Create a user
curl -X POST http://localhost:3000/users \
  -H "Content-Type: application/json" \
  -d '{"name": "John Doe", "email": "john@example.com"}'

# Get user by ID
curl http://localhost:3000/users/1
```

## Next Steps

- Learn about [Modules](./modules.md) in depth
- Explore [Controllers](./controllers.md) and HTTP decorators
- Understand [Providers](./providers.md) and dependency injection
- Implement [Lifecycle Hooks](./lifecycle.md)
- Add [Validation](./validation.md) with Zod
- Configure [Logging](./logging.md)


# Controllers

Controllers handle incoming HTTP requests and return responses. They use decorators to define routes and can inject services for business logic.

## Overview

A controller is a class decorated with `@Controller()` that contains route handlers:

```typescript
@Controller('/users')
class UserController {
  @Get()
  findAll() {
    return []
  }
}
```

## The @Controller Decorator

The `@Controller()` decorator marks a class as a controller and optionally sets a base path:

```typescript
@Controller()           // Routes at /
@Controller('/users')   // Routes at /users
@Controller('/api/v1')  // Routes at /api/v1
```

## HTTP Method Decorators

### @Get()

Handles HTTP GET requests:

```typescript
@Controller('/users')
class UserController {
  @Get()              // GET /users
  findAll() {}

  @Get('/:id')        // GET /users/:id
  findOne() {}

  @Get('/search')     // GET /users/search
  search() {}
}
```

### @Post()

Handles HTTP POST requests:

```typescript
@Controller('/users')
class UserController {
  @Post()             // POST /users
  create() {}

  @Post('/bulk')      // POST /users/bulk
  createMany() {}
}
```

### @Put()

Handles HTTP PUT requests (full update):

```typescript
@Controller('/users')
class UserController {
  @Put('/:id')        // PUT /users/:id
  replace() {}
}
```

### @Patch()

Handles HTTP PATCH requests (partial update):

```typescript
@Controller('/users')
class UserController {
  @Patch('/:id')      // PATCH /users/:id
  update() {}
}
```

### @Delete()

Handles HTTP DELETE requests:

```typescript
@Controller('/users')
class UserController {
  @Delete('/:id')     // DELETE /users/:id
  remove() {}
}
```

## Request Context

Route handlers receive the Elysia context with typed parameters:

```typescript
import type { ElysiaContext } from 'elysiajs-di'

@Controller('/users')
class UserController {
  @Get('/:id')
  findOne({ params, query, headers, request }: ElysiaContext) {
    // params.id - URL parameters
    // query.search - Query string parameters
    // headers['authorization'] - HTTP headers
    // request - Raw Request object
    return { id: params.id }
  }

  @Post()
  create({ body, set }: ElysiaContext) {
    // body - Request body
    // set.status - Set response status
    // set.headers - Set response headers
    
    set.status = 201
    return body
  }
}
```

## Dependency Injection

Controllers can inject services through their constructor:

```typescript
@Controller('/users')
class UserController {
  constructor(
    private userService: UserService,
    private logger: Logger
  ) {}

  @Get()
  findAll() {
    this.logger.log('Fetching users')
    return this.userService.findAll()
  }
}
```

## Route Validation

Add validation using Zod schemas in the decorator options:

```typescript
import { z } from 'zod'

const CreateUserSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Invalid email format'),
  age: z.number().int().positive().optional()
})

const UserIdSchema = z.object({
  id: z.coerce.number().int().positive()
})

@Controller('/users')
class UserController {
  @Get('/:id', {
    params: UserIdSchema
  })
  findOne({ params }: ElysiaContext<unknown, z.infer<typeof UserIdSchema>>) {
    // params.id is now a validated number
    return this.userService.findById(params.id)
  }

  @Post('/', {
    body: CreateUserSchema
  })
  create({ body }: ElysiaContext<z.infer<typeof CreateUserSchema>>) {
    // body is validated and typed
    return this.userService.create(body)
  }

  @Put('/:id', {
    params: UserIdSchema,
    body: CreateUserSchema
  })
  update({ params, body }) {
    return this.userService.update(params.id, body)
  }
}
```

### Validation Options

| Option | Description |
|--------|-------------|
| `body` | Validates request body |
| `params` | Validates URL parameters |
| `query` | Validates query string |
| `headers` | Validates request headers |
| `response` | Validates response body |

## Response Handling

### Returning Data

Return any JSON-serializable value:

```typescript
@Get()
findAll() {
  return [{ id: 1, name: 'John' }]
}
```

### Setting Status Code

Use `set.status` to change the response status:

```typescript
@Post()
create({ body, set }: ElysiaContext) {
  set.status = 201 // Created
  return this.userService.create(body)
}

@Delete('/:id')
remove({ params, set }: ElysiaContext) {
  const deleted = this.userService.delete(params.id)
  if (!deleted) {
    set.status = 404
    return { error: 'Not found' }
  }
  set.status = 204 // No Content
  return null
}
```

### Setting Headers

```typescript
@Get()
findAll({ set }: ElysiaContext) {
  set.headers['X-Total-Count'] = '100'
  set.headers['Cache-Control'] = 'max-age=3600'
  return this.userService.findAll()
}
```

## Error Handling

Errors are automatically caught and formatted:

```typescript
@Get('/:id')
findOne({ params, set }: ElysiaContext) {
  const user = this.userService.findById(params.id)
  
  if (!user) {
    set.status = 404
    return { error: 'User not found' }
  }
  
  return user
}
```

Validation errors return 400 with details:

```json
{
  "error": "Validation error",
  "message": "email: Invalid email format",
  "details": [
    {
      "code": "invalid_string",
      "path": ["email"],
      "message": "Invalid email format"
    }
  ]
}
```

## Complete Example

```typescript
import { z } from 'zod'
import { Controller, Get, Post, Put, Delete } from 'elysiajs-di'
import type { ElysiaContext } from 'elysiajs-di'
import { UserService } from './user.service'

// Validation Schemas
const CreateUserDto = z.object({
  name: z.string().min(2).max(100),
  email: z.string().email(),
  role: z.enum(['user', 'admin']).default('user')
})

const UpdateUserDto = CreateUserDto.partial()

const UserIdParam = z.object({
  id: z.coerce.number().int().positive()
})

const PaginationQuery = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().min(1).max(100).default(10)
})

@Controller('/users')
export class UserController {
  constructor(private userService: UserService) {}

  @Get('/', { query: PaginationQuery })
  async findAll({ query }: ElysiaContext<unknown, unknown, z.infer<typeof PaginationQuery>>) {
    const { page, limit } = query
    return this.userService.findAll({ page, limit })
  }

  @Get('/:id', { params: UserIdParam })
  async findOne({ params, set }: ElysiaContext<unknown, z.infer<typeof UserIdParam>>) {
    const user = await this.userService.findById(params.id)
    if (!user) {
      set.status = 404
      return { error: 'User not found' }
    }
    return user
  }

  @Post('/', { body: CreateUserDto })
  async create({ body, set }: ElysiaContext<z.infer<typeof CreateUserDto>>) {
    const user = await this.userService.create(body)
    set.status = 201
    return user
  }

  @Put('/:id', { params: UserIdParam, body: UpdateUserDto })
  async update({ params, body, set }: ElysiaContext<z.infer<typeof UpdateUserDto>, z.infer<typeof UserIdParam>>) {
    const user = await this.userService.update(params.id, body)
    if (!user) {
      set.status = 404
      return { error: 'User not found' }
    }
    return user
  }

  @Delete('/:id', { params: UserIdParam })
  async remove({ params, set }: ElysiaContext<unknown, z.infer<typeof UserIdParam>>) {
    const deleted = await this.userService.delete(params.id)
    if (!deleted) {
      set.status = 404
      return { error: 'User not found' }
    }
    set.status = 204
    return null
  }
}
```


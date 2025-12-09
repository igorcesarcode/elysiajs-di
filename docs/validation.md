# Validation

ElysiaJS-DI provides built-in support for request validation using Zod schemas.

## Overview

Validation is applied through decorator options:

```typescript
import { z } from 'zod'

@Post('/', {
  body: z.object({
    name: z.string(),
    email: z.string().email()
  })
})
createUser({ body }) {
  // body is validated and typed
}
```

## Installation

```bash
bun add zod
```

## Validation Options

You can validate different parts of the request:

| Option     | Description                |
| ---------- | -------------------------- |
| `body`     | Request body validation    |
| `params`   | URL parameters validation  |
| `query`    | Query string validation    |
| `headers`  | Request headers validation |
| `response` | Response body validation   |

## Body Validation

Validate the request body:

```typescript
const CreateUserSchema = z.object({
  name: z.string().min(2).max(100),
  email: z.string().email(),
  age: z.number().int().positive().optional(),
  role: z.enum(['user', 'admin']).default('user')
})

@Post('/', { body: CreateUserSchema })
createUser({ body }: ElysiaContext<z.infer<typeof CreateUserSchema>>) {
  // body.name - string (2-100 chars)
  // body.email - valid email string
  // body.age - positive integer or undefined
  // body.role - 'user' or 'admin'
  return this.userService.create(body)
}
```

## Params Validation

Validate URL parameters:

```typescript
const UserIdParam = z.object({
  id: z.coerce.number().int().positive()
})

@Get('/:id', { params: UserIdParam })
getUser({ params }: ElysiaContext<unknown, z.infer<typeof UserIdParam>>) {
  // params.id is a validated positive integer
  return this.userService.findById(params.id)
}
```

**Note:** Use `z.coerce.number()` for URL params since they are strings.

## Query Validation

Validate query string parameters:

```typescript
const PaginationQuery = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().min(1).max(100).default(10),
  sort: z.enum(['asc', 'desc']).optional(),
  search: z.string().optional()
})

@Get('/', { query: PaginationQuery })
getUsers({ query }: ElysiaContext<unknown, unknown, z.infer<typeof PaginationQuery>>) {
  // query.page - positive integer, defaults to 1
  // query.limit - 1-100, defaults to 10
  // query.sort - 'asc' or 'desc' or undefined
  // query.search - string or undefined
  return this.userService.findAll(query)
}
```

## Headers Validation

Validate request headers:

```typescript
const AuthHeaders = z.object({
  authorization: z.string().startsWith('Bearer ')
})

@Get('/profile', { headers: AuthHeaders })
getProfile({ headers }) {
  const token = headers.authorization.replace('Bearer ', '')
  return this.authService.getProfile(token)
}
```

## Combined Validation

Combine multiple validations:

```typescript
const UserIdParam = z.object({
  id: z.coerce.number().int().positive()
})

const UpdateUserSchema = z.object({
  name: z.string().min(2).optional(),
  email: z.string().email().optional()
})

@Put('/:id', {
  params: UserIdParam,
  body: UpdateUserSchema
})
updateUser({
  params,
  body
}: ElysiaContext<z.infer<typeof UpdateUserSchema>, z.infer<typeof UserIdParam>>) {
  return this.userService.update(params.id, body)
}
```

## Common Validation Patterns

### Required vs Optional

```typescript
const Schema = z.object({
  required: z.string(), // Must be present
  optional: z.string().optional(), // Can be undefined
  nullable: z.string().nullable(), // Can be null
  withDefault: z.string().default("default"), // Uses default if missing
});
```

### String Validation

```typescript
const StringSchema = z.object({
  name: z.string().min(2).max(100),
  email: z.string().email(),
  url: z.string().url(),
  uuid: z.string().uuid(),
  regex: z.string().regex(/^[A-Z]{2}[0-9]{4}$/),
  enum: z.enum(["option1", "option2", "option3"]),
});
```

### Number Validation

```typescript
const NumberSchema = z.object({
  integer: z.number().int(),
  positive: z.number().positive(),
  range: z.number().min(0).max(100),
  coerced: z.coerce.number(), // Converts string to number
});
```

### Array Validation

```typescript
const ArraySchema = z.object({
  tags: z.array(z.string()),
  numbers: z.array(z.number()).min(1).max(10),
  unique: z
    .array(z.string())
    .refine(
      (items) => new Set(items).size === items.length,
      "Array must have unique items"
    ),
});
```

### Object Validation

```typescript
const NestedSchema = z.object({
  user: z.object({
    name: z.string(),
    address: z.object({
      street: z.string(),
      city: z.string(),
      zip: z.string(),
    }),
  }),
});
```

### Custom Validation

```typescript
const CustomSchema = z
  .object({
    password: z
      .string()
      .min(8)
      .refine(
        (val) => /[A-Z]/.test(val),
        "Password must contain uppercase letter"
      )
      .refine((val) => /[0-9]/.test(val), "Password must contain number"),

    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords must match",
    path: ["confirmPassword"],
  });
```

## Error Handling

Validation errors return a 400 status with details:

```json
{
  "error": "Validation error",
  "message": "email: Invalid email format, name: String must contain at least 2 character(s)",
  "details": [
    {
      "code": "invalid_string",
      "validation": "email",
      "path": ["email"],
      "message": "Invalid email format"
    },
    {
      "code": "too_small",
      "minimum": 2,
      "type": "string",
      "inclusive": true,
      "path": ["name"],
      "message": "String must contain at least 2 character(s)"
    }
  ]
}
```

## Type Inference

Use `z.infer` for automatic type inference:

```typescript
const CreateUserSchema = z.object({
  name: z.string(),
  email: z.string().email()
})

// Infer the type
type CreateUserDto = z.infer<typeof CreateUserSchema>
// { name: string; email: string }

@Post('/', { body: CreateUserSchema })
createUser({ body }: ElysiaContext<CreateUserDto>) {
  // body is fully typed
}
```

## Complete Example

```typescript
import { z } from "zod";
import { Controller, Get, Post, Put, Delete } from "@igorcesarcode/elysiajs-di";
import type { ElysiaContext } from "@igorcesarcode/elysiajs-di";

// Schemas
const CreateUserSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  email: z.string().email("Invalid email format"),
  password: z.string().min(8, "Password must be at least 8 characters"),
  role: z.enum(["user", "admin"]).default("user"),
});

const UpdateUserSchema = z.object({
  name: z.string().min(2).optional(),
  email: z.string().email().optional(),
});

const UserIdParam = z.object({
  id: z.coerce.number().int().positive("ID must be a positive integer"),
});

const ListUsersQuery = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  role: z.enum(["user", "admin", "all"]).default("all"),
  search: z.string().optional(),
});

// Types
type CreateUserDto = z.infer<typeof CreateUserSchema>;
type UpdateUserDto = z.infer<typeof UpdateUserSchema>;
type UserIdParams = z.infer<typeof UserIdParam>;
type ListUsersQueryParams = z.infer<typeof ListUsersQuery>;

@Controller("/users")
export class UserController {
  constructor(private userService: UserService) {}

  @Get("/", { query: ListUsersQuery })
  listUsers({ query }: ElysiaContext<unknown, unknown, ListUsersQueryParams>) {
    return this.userService.findAll({
      page: query.page,
      limit: query.limit,
      role: query.role === "all" ? undefined : query.role,
      search: query.search,
    });
  }

  @Get("/:id", { params: UserIdParam })
  getUser({ params, set }: ElysiaContext<unknown, UserIdParams>) {
    const user = this.userService.findById(params.id);
    if (!user) {
      set.status = 404;
      return { error: "User not found" };
    }
    return user;
  }

  @Post("/", { body: CreateUserSchema })
  createUser({ body, set }: ElysiaContext<CreateUserDto>) {
    const user = this.userService.create(body);
    set.status = 201;
    return user;
  }

  @Put("/:id", { params: UserIdParam, body: UpdateUserSchema })
  updateUser({
    params,
    body,
    set,
  }: ElysiaContext<UpdateUserDto, UserIdParams>) {
    const user = this.userService.update(params.id, body);
    if (!user) {
      set.status = 404;
      return { error: "User not found" };
    }
    return user;
  }

  @Delete("/:id", { params: UserIdParam })
  deleteUser({ params, set }: ElysiaContext<unknown, UserIdParams>) {
    const deleted = this.userService.delete(params.id);
    if (!deleted) {
      set.status = 404;
      return { error: "User not found" };
    }
    set.status = 204;
    return null;
  }
}
```

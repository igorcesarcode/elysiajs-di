import 'reflect-metadata'
import { ROUTES_KEY } from './constants'
import type { RouteMetadata, RouteOptions } from '../types'

/**
 * Creates a route decorator for HTTP methods with optional validation and OpenAPI documentation
 * @internal
 */
function createRouteDecorator(
  method: RouteMetadata['method'],
  path: string,
  options?: RouteOptions
): MethodDecorator {
  return function (target: Object, propertyKey: string | symbol) {
    const routes: RouteMetadata[] = Reflect.getMetadata(ROUTES_KEY, target.constructor) || []

    routes.push({
      method,
      path,
      handlerName: String(propertyKey),
      options
    })

    Reflect.defineMetadata(ROUTES_KEY, routes, target.constructor)
  }
}

/**
 * HTTP GET route decorator
 * 
 * Defines a GET endpoint with optional validation and OpenAPI documentation.
 * 
 * @param pathOrOptions - Route path (string) or route options object
 * @param options - Route options including validation schemas and OpenAPI details
 * 
 * @remarks
 * Route options include:
 * - `body` - Zod schema for request body validation
 * - `params` - Zod schema for URL parameters validation
 * - `query` - Zod schema for query string validation
 * - `headers` - Zod schema for headers validation
 * - `response` - Zod schema for response validation
 * - `detail` - OpenAPI documentation options:
 *   - `tags` - Array of tag names for grouping in Swagger UI
 *   - `summary` - Short description of the endpoint
 *   - `description` - Detailed description of the endpoint
 *   - `deprecated` - Mark endpoint as deprecated
 *   - `security` - Security requirements (e.g., `[{ bearerAuth: [] }]`)
 *   - `hide` - Hide endpoint from OpenAPI documentation
 * 
 * @example
 * ```typescript
 * // Simple route
 * @Get()
 * getAllItems() { return [] }
 * 
 * // Route with path
 * @Get('/:id')
 * getItemById({ params }) { return { id: params.id } }
 * 
 * // Route with validation
 * @Get('/:id', {
 *   params: z.object({ id: z.coerce.number() })
 * })
 * getItemById({ params }) { return { id: params.id } }
 * 
 * // Route with OpenAPI documentation
 * @Get('/', {
 *   detail: {
 *     tags: ['Users'],
 *     summary: 'Get all users',
 *     description: 'Returns a paginated list of all users'
 *   }
 * })
 * getAllUsers() { return this.userService.findAll() }
 * 
 * // Route with validation AND OpenAPI
 * @Get('/:id', {
 *   params: z.object({ id: z.coerce.number() }),
 *   detail: {
 *     tags: ['Users'],
 *     summary: 'Get user by ID',
 *     security: [{ bearerAuth: [] }]
 *   }
 * })
 * getUserById({ params }) { return this.userService.findById(params.id) }
 * ```
 */
export function Get(pathOrOptions?: string | RouteOptions, options?: RouteOptions): MethodDecorator {
  if (typeof pathOrOptions === 'object') {
    return createRouteDecorator('get', '', pathOrOptions)
  }
  return createRouteDecorator('get', pathOrOptions || '', options)
}

/**
 * HTTP POST route decorator
 * 
 * Defines a POST endpoint with optional validation and OpenAPI documentation.
 * 
 * @param pathOrOptions - Route path (string) or route options object
 * @param options - Route options including validation schemas and OpenAPI details
 * 
 * @remarks
 * Route options include:
 * - `body` - Zod schema for request body validation
 * - `params` - Zod schema for URL parameters validation
 * - `query` - Zod schema for query string validation
 * - `headers` - Zod schema for headers validation
 * - `response` - Zod schema for response validation
 * - `detail` - OpenAPI documentation options:
 *   - `tags` - Array of tag names for grouping in Swagger UI
 *   - `summary` - Short description of the endpoint
 *   - `description` - Detailed description of the endpoint
 *   - `deprecated` - Mark endpoint as deprecated
 *   - `security` - Security requirements (e.g., `[{ bearerAuth: [] }]`)
 *   - `hide` - Hide endpoint from OpenAPI documentation
 * 
 * @example
 * ```typescript
 * // Simple route
 * @Post()
 * createItem({ body }) { return body }
 * 
 * // Route with body validation
 * @Post('/', {
 *   body: z.object({
 *     name: z.string().min(1),
 *     email: z.string().email()
 *   })
 * })
 * createUser({ body }) { return this.userService.create(body) }
 * 
 * // Route with validation AND OpenAPI documentation
 * @Post('/', {
 *   body: z.object({
 *     name: z.string().min(2),
 *     email: z.string().email()
 *   }),
 *   detail: {
 *     tags: ['Users'],
 *     summary: 'Create a new user',
 *     description: 'Creates a new user with the provided name and email'
 *   }
 * })
 * createUser({ body }) { return this.userService.create(body) }
 * ```
 */
export function Post(pathOrOptions?: string | RouteOptions, options?: RouteOptions): MethodDecorator {
  if (typeof pathOrOptions === 'object') {
    return createRouteDecorator('post', '', pathOrOptions)
  }
  return createRouteDecorator('post', pathOrOptions || '', options)
}

/**
 * HTTP PUT route decorator
 * 
 * Defines a PUT endpoint for full resource replacement with optional validation and OpenAPI documentation.
 * 
 * @param pathOrOptions - Route path (string) or route options object
 * @param options - Route options including validation schemas and OpenAPI details
 * 
 * @remarks
 * Route options include:
 * - `body` - Zod schema for request body validation
 * - `params` - Zod schema for URL parameters validation
 * - `query` - Zod schema for query string validation
 * - `headers` - Zod schema for headers validation
 * - `response` - Zod schema for response validation
 * - `detail` - OpenAPI documentation options:
 *   - `tags` - Array of tag names for grouping in Swagger UI
 *   - `summary` - Short description of the endpoint
 *   - `description` - Detailed description of the endpoint
 *   - `deprecated` - Mark endpoint as deprecated
 *   - `security` - Security requirements (e.g., `[{ bearerAuth: [] }]`)
 *   - `hide` - Hide endpoint from OpenAPI documentation
 * 
 * @example
 * ```typescript
 * // Route with validation
 * @Put('/:id', {
 *   params: z.object({ id: z.coerce.number() }),
 *   body: z.object({ name: z.string(), email: z.string().email() })
 * })
 * updateUser({ params, body }) { return this.userService.update(params.id, body) }
 * 
 * // Route with validation AND OpenAPI documentation
 * @Put('/:id', {
 *   params: z.object({ id: z.coerce.number() }),
 *   body: z.object({ name: z.string(), email: z.string().email() }),
 *   detail: {
 *     tags: ['Users'],
 *     summary: 'Update user',
 *     description: 'Fully replaces an existing user by ID'
 *   }
 * })
 * updateUser({ params, body }) { return this.userService.update(params.id, body) }
 * ```
 */
export function Put(pathOrOptions?: string | RouteOptions, options?: RouteOptions): MethodDecorator {
  if (typeof pathOrOptions === 'object') {
    return createRouteDecorator('put', '', pathOrOptions)
  }
  return createRouteDecorator('put', pathOrOptions || '', options)
}

/**
 * HTTP DELETE route decorator
 * 
 * Defines a DELETE endpoint for resource removal with optional validation and OpenAPI documentation.
 * 
 * @param pathOrOptions - Route path (string) or route options object
 * @param options - Route options including validation schemas and OpenAPI details
 * 
 * @remarks
 * Route options include:
 * - `body` - Zod schema for request body validation
 * - `params` - Zod schema for URL parameters validation
 * - `query` - Zod schema for query string validation
 * - `headers` - Zod schema for headers validation
 * - `response` - Zod schema for response validation
 * - `detail` - OpenAPI documentation options:
 *   - `tags` - Array of tag names for grouping in Swagger UI
 *   - `summary` - Short description of the endpoint
 *   - `description` - Detailed description of the endpoint
 *   - `deprecated` - Mark endpoint as deprecated
 *   - `security` - Security requirements (e.g., `[{ bearerAuth: [] }]`)
 *   - `hide` - Hide endpoint from OpenAPI documentation
 * 
 * @example
 * ```typescript
 * // Route with validation
 * @Delete('/:id', {
 *   params: z.object({ id: z.coerce.number() })
 * })
 * deleteUser({ params }) { return this.userService.delete(params.id) }
 * 
 * // Route with validation AND OpenAPI documentation
 * @Delete('/:id', {
 *   params: z.object({ id: z.coerce.number() }),
 *   detail: {
 *     tags: ['Users'],
 *     summary: 'Delete user',
 *     description: 'Permanently removes a user by ID',
 *     security: [{ bearerAuth: [] }]
 *   }
 * })
 * deleteUser({ params }) { return this.userService.delete(params.id) }
 * ```
 */
export function Delete(pathOrOptions?: string | RouteOptions, options?: RouteOptions): MethodDecorator {
  if (typeof pathOrOptions === 'object') {
    return createRouteDecorator('delete', '', pathOrOptions)
  }
  return createRouteDecorator('delete', pathOrOptions || '', options)
}

/**
 * HTTP PATCH route decorator
 * 
 * Defines a PATCH endpoint for partial resource updates with optional validation and OpenAPI documentation.
 * 
 * @param pathOrOptions - Route path (string) or route options object
 * @param options - Route options including validation schemas and OpenAPI details
 * 
 * @remarks
 * Route options include:
 * - `body` - Zod schema for request body validation
 * - `params` - Zod schema for URL parameters validation
 * - `query` - Zod schema for query string validation
 * - `headers` - Zod schema for headers validation
 * - `response` - Zod schema for response validation
 * - `detail` - OpenAPI documentation options:
 *   - `tags` - Array of tag names for grouping in Swagger UI
 *   - `summary` - Short description of the endpoint
 *   - `description` - Detailed description of the endpoint
 *   - `deprecated` - Mark endpoint as deprecated
 *   - `security` - Security requirements (e.g., `[{ bearerAuth: [] }]`)
 *   - `hide` - Hide endpoint from OpenAPI documentation
 * 
 * @example
 * ```typescript
 * // Route with validation (partial update - all fields optional)
 * @Patch('/:id', {
 *   params: z.object({ id: z.coerce.number() }),
 *   body: z.object({
 *     name: z.string().optional(),
 *     email: z.string().email().optional()
 *   })
 * })
 * patchUser({ params, body }) { return this.userService.patch(params.id, body) }
 * 
 * // Route with validation AND OpenAPI documentation
 * @Patch('/:id', {
 *   params: z.object({ id: z.coerce.number() }),
 *   body: z.object({
 *     name: z.string().optional(),
 *     email: z.string().email().optional()
 *   }),
 *   detail: {
 *     tags: ['Users'],
 *     summary: 'Partial update user',
 *     description: 'Updates specific fields of an existing user'
 *   }
 * })
 * patchUser({ params, body }) { return this.userService.patch(params.id, body) }
 * ```
 */
export function Patch(pathOrOptions?: string | RouteOptions, options?: RouteOptions): MethodDecorator {
  if (typeof pathOrOptions === 'object') {
    return createRouteDecorator('patch', '', pathOrOptions)
  }
  return createRouteDecorator('patch', pathOrOptions || '', options)
}

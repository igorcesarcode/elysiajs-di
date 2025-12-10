import 'reflect-metadata'
import { ROUTES_KEY, GUARDS_KEY } from './constants'
import type { RouteMetadata } from '../types'
import type { CanActivate } from '../types/guards'
import type { Constructor } from '../types'

/**
 * UseGuards decorator - Apply guards to a route handler
 * 
 * Guards are executed before the route handler. If any guard returns false,
 * the request is rejected with 401 Unauthorized or 403 Forbidden.
 * 
 * @param guards - One or more guard classes that implement CanActivate
 * 
 * @example
 * ```typescript
 * @Controller('/users')
 * class UserController {
 *   @Get('/profile')
 *   @UseGuards(AuthGuard)
 *   getProfile({ user }) {
 *     return { user }
 *   }
 * 
 *   @Get('/admin')
 *   @UseGuards(AuthGuard, AdminGuard)
 *   getAdmin() {
 *     return { message: 'Admin only' }
 *   }
 * }
 * ```
 */
export function UseGuards(...guards: Constructor<CanActivate>[]): MethodDecorator {
  return function (target: Object, propertyKey: string | symbol) {
    const routes: RouteMetadata[] = Reflect.getMetadata(ROUTES_KEY, target.constructor) || []

    // Find the route for this handler
    const route = routes.find(r => r.handlerName === String(propertyKey))

    if (route) {
      // Add guards to existing route metadata
      route.guards = guards
    } else {
      // If route doesn't exist yet, store guards separately
      // They will be merged when the route is created
      const existingGuards: Constructor<CanActivate>[] = Reflect.getMetadata(GUARDS_KEY, target, propertyKey) || []
      Reflect.defineMetadata(GUARDS_KEY, [...existingGuards, ...guards], target, propertyKey)
    }
  }
}

/**
 * Get guards metadata for a method
 * @internal
 */
export function getGuardsMetadata(
  target: Object,
  propertyKey: string | symbol
): Constructor<CanActivate>[] | undefined {
  // First check route metadata
  const routes: RouteMetadata[] = Reflect.getMetadata(ROUTES_KEY, target.constructor) || []
  const route = routes.find(r => r.handlerName === String(propertyKey))

  if (route?.guards) {
    return route.guards
  }

  // Fallback to method metadata
  return Reflect.getMetadata(GUARDS_KEY, target, propertyKey)
}


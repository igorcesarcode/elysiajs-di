import 'reflect-metadata'
import { JWT_REQUIRED_KEY } from './constants'

/**
 * JWT decorator options
 */
export interface JWTOptions {
  /**
   * JWT plugin name (must match the name used in registerJWT)
   * @default 'jwt'
   */
  name?: string

  /**
   * Whether JWT is required (if false, token is optional but validated if present)
   * @default true
   */
  required?: boolean
}

/**
 * JWT decorator metadata stored on methods
 */
export interface JWTMetadata {
  /**
   * JWT plugin name
   */
  name: string

  /**
   * Whether JWT is required
   */
  required: boolean
}

/**
 * JWT decorator - Marks a route handler as requiring JWT authentication
 * 
 * When applied to a method, the route will automatically validate JWT tokens
 * before executing the handler. If validation fails, a 401 Unauthorized response
 * is returned.
 * 
 * The verified JWT payload is available in the context via the JWT plugin name
 * (default: 'jwt'). Access it using `context.jwt` or `context[options.name]`.
 * 
 * @param options - JWT decorator options
 * 
 * @example
 * ```typescript
 * @Controller('/users')
 * class UserController {
 *   @Get('/profile')
 *   @JWT()
 *   getProfile({ jwt }) {
 *     // jwt contains the verified JWT payload
 *     return { userId: jwt.userId, email: jwt.email }
 *   }
 * 
 *   @Get('/public')
 *   getPublic() {
 *     // This route doesn't require JWT
 *     return { message: 'Public data' }
 *   }
 * 
 *   @Get('/optional')
 *   @JWT({ required: false })
 *   getOptional({ jwt }) {
 *     // JWT is optional, but validated if present
 *     if (jwt) {
 *       return { user: jwt, authenticated: true }
 *     }
 *     return { authenticated: false }
 *   }
 * }
 * ```
 */
export function JWT(options?: JWTOptions): MethodDecorator {
  return function (target: Object, propertyKey: string | symbol) {
    const metadata: JWTMetadata = {
      name: options?.name || 'jwt',
      required: options?.required !== false
    }

    Reflect.defineMetadata(JWT_REQUIRED_KEY, metadata, target, propertyKey)
  }
}

/**
 * Get JWT metadata for a method
 * @internal
 */
export function getJWTMetadata(
  target: Object,
  propertyKey: string | symbol
): JWTMetadata | undefined {
  return Reflect.getMetadata(JWT_REQUIRED_KEY, target, propertyKey)
}


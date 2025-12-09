import { singleton, injectable } from 'tsyringe'

/**
 * Marks a class as a singleton provider
 * The same instance will be returned every time it's resolved
 * 
 * @example
 * ```typescript
 * @Singleton()
 * class UserService {
 *   // Single instance shared across the application
 * }
 * ```
 */
export const Singleton = singleton

/**
 * Marks a class as injectable
 * A new instance will be created every time it's resolved
 * 
 * @example
 * ```typescript
 * @Injectable()
 * class RequestScopedService {
 *   // New instance for each injection
 * }
 * ```
 */
export const Injectable = injectable


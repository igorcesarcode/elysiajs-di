import 'reflect-metadata'
import { MODULE_KEY } from './constants'
import type { ModuleMetadata } from '../types'

/**
 * Decorator to define a module
 * 
 * Modules organize related features and can import other modules,
 * declare controllers, and provide services.
 * 
 * @example
 * ```typescript
 * @Module({
 *   imports: [LoggerModule],
 *   controllers: [UserController],
 *   providers: [UserService],
 *   exports: [UserService]
 * })
 * class UserModule {}
 * ```
 */
export function Module(metadata: ModuleMetadata): ClassDecorator {
  return function (target: Function) {
    Reflect.defineMetadata(MODULE_KEY, metadata, target)
    return target as any
  }
}


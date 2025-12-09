import 'reflect-metadata'
import { injectable } from 'tsyringe'
import { CONTROLLER_BASE_PATH_KEY } from './constants'

/**
 * Decorator to define a controller
 * 
 * Controllers handle HTTP requests and define routes.
 * The basePath is prepended to all route paths in the controller.
 * 
 * @param basePath - Base path for all routes in this controller (default: '')
 * 
 * @example
 * ```typescript
 * @Controller('/users')
 * class UserController {
 *   @Get()
 *   getAllUsers() {
 *     return []
 *   }
 * 
 *   @Get('/:id')
 *   getUserById({ params }: ElysiaContext) {
 *     return { id: params.id }
 *   }
 * }
 * ```
 */
export function Controller(basePath: string = ''): ClassDecorator {
  return function (target: Function) {
    Reflect.defineMetadata(CONTROLLER_BASE_PATH_KEY, basePath, target)
    return injectable()(target as any)
  }
}


import type { Constructor } from './interfaces'

/**
 * Execution context for guards
 * Provides access to request, handler, and controller information
 */
export interface ExecutionContext {
  /**
   * Elysia request context (params, query, body, headers, etc.)
   */
  context: {
    params: Record<string, string>
    query: Record<string, string | undefined>
    body: unknown
    headers: Record<string, string | undefined>
    request: Request
    set: {
      status?: number
      headers: Record<string, string>
    }
    [key: string]: unknown
  }

  /**
   * Handler method name
   */
  handler: string

  /**
   * Controller class constructor
   */
  controller: Constructor

  /**
   * Controller instance
   */
  controllerInstance: unknown

  /**
   * Additional data that guards can attach (e.g., user, permissions)
   */
  data?: Record<string, unknown>
}

/**
 * Guard interface for route protection
 * Similar to NestJS CanActivate
 */
export interface CanActivate {
  /**
   * Determines if the route can be activated
   * @param context - Execution context with request and handler info
   * @returns true if route can be activated, false otherwise
   */
  canActivate(context: ExecutionContext): boolean | Promise<boolean>
}


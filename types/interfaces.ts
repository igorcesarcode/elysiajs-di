import type { Elysia } from 'elysia'
import type { ZodType } from 'zod'
import type { CORSConfig } from '../plugins/cors.plugin'
import type { CronConfig } from '../plugins/cron.plugin'
import type { JWTConfig } from '../plugins/jwt.plugin'

/**
 * OpenAPI route detail configuration
 */
export interface RouteDetail {
  /** OpenAPI tags for grouping */
  tags?: string[]
  /** Short summary of the endpoint */
  summary?: string
  /** Detailed description of the endpoint */
  description?: string
  /** Mark endpoint as deprecated */
  deprecated?: boolean
  /** Security requirements */
  security?: Array<Record<string, string[]>>
  /** Hide from OpenAPI documentation */
  hide?: boolean
}

/**
 * Route validation options using Zod schemas
 */
export interface RouteValidation {
  /** Zod schema for request body validation */
  body?: ZodType<any>
  /** Zod schema for URL params validation */
  params?: ZodType<any>
  /** Zod schema for query string validation */
  query?: ZodType<any>
  /** Zod schema for headers validation */
  headers?: ZodType<any>
  /** Zod schema for response validation */
  response?: ZodType<any>
}

/**
 * Route configuration options
 */
export interface RouteOptions extends RouteValidation {
  /** Route description for documentation (deprecated, use detail.description) */
  description?: string
  /** Route tags for documentation grouping (deprecated, use detail.tags) */
  tags?: string[]
  /** OpenAPI detail configuration */
  detail?: RouteDetail
}

/**
 * Metadata for HTTP route definitions
 */
export interface RouteMetadata {
  method: 'get' | 'post' | 'put' | 'delete' | 'patch'
  path: string
  handlerName: string
  options?: RouteOptions
}

/**
 * Plugin configurations for module-level registration
 */
export interface ModulePluginConfig {
  /** JWT plugin configuration */
  jwt?: JWTConfig
  /** CORS plugin configuration */
  cors?: CORSConfig
  /** Cron plugin configuration */
  cron?: CronConfig
}

/**
 * Metadata for module configuration
 */
export interface ModuleMetadata {
  /** Other modules to import */
  imports?: Constructor[]
  /** Controllers that handle HTTP requests */
  controllers?: Constructor[]
  /** Services/providers available in this module */
  providers?: Constructor[]
  /** Providers to export for other modules */
  exports?: Constructor[]
  /** Plugin configurations for automatic registration */
  plugins?: ModulePluginConfig
}

/**
 * Generic constructor type for classes
 */
export type Constructor<T = any> = new (...args: any[]) => T

/**
 * Error handler context
 */
export interface ErrorContext {
  code: string
  error: Error
  set: {
    status?: number
    headers: Record<string, string>
  }
  request: Request
  path: string
}

/**
 * Custom error handler function type
 */
export type ErrorHandler = (context: ErrorContext) => unknown

/**
 * Bootstrap options for the application
 */
export interface BootstrapOptions {
  /** Enable verbose logging */
  verbose?: boolean
  /** Custom logger function */
  logger?: (message: string) => void
  /** Paths to ignore in error logging (e.g., favicon.ico) */
  ignoredPaths?: string[]
  /** Custom error handler (overrides default) */
  errorHandler?: ErrorHandler
  /** Enable default error handling (default: true) */
  enableErrorHandling?: boolean
}

/**
 * Elysia context type (simplified for handler methods)
 */
export interface ElysiaContext<TBody = unknown, TParams = Record<string, string>, TQuery = Record<string, string | undefined>> {
  params: TParams
  query: TQuery
  body: TBody
  headers: Record<string, string | undefined>
  request: Request
  set: {
    status?: number
    headers: Record<string, string>
  }
}

/**
 * Module factory interface
 */
export interface IModuleFactory {
  registerModule(moduleClass: Constructor, app: Elysia): Promise<void>
  bootstrap(rootModule: Constructor, app: Elysia, options?: BootstrapOptions): Promise<void>
}

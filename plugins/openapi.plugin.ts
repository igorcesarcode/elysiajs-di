/**
 * OpenAPI Plugin Integration for ElysiaJS-DI
 * 
 * Provides automatic OpenAPI/Swagger documentation generation
 */

import type { Elysia } from 'elysia'
import { internalLogger } from '../factory/internal-logger'

/**
 * OpenAPI documentation configuration
 */
export interface OpenAPIConfig {
  /**
   * Path where Swagger UI will be served
   * @default '/swagger'
   */
  path?: string

  /**
   * OpenAPI specification version
   * @default '3.1.0'
   */
  version?: string

  /**
   * API documentation info
   */
  documentation?: {
    info?: {
      title?: string
      description?: string
      version?: string
      contact?: {
        name?: string
        email?: string
        url?: string
      }
      license?: {
        name?: string
        url?: string
      }
    }
    servers?: Array<{
      url: string
      description?: string
    }>
    tags?: Array<{
      name: string
      description?: string
    }>
    components?: {
      securitySchemes?: Record<string, {
        type: string
        scheme?: string
        bearerFormat?: string
        name?: string
        in?: string
      }>
    }
  }

  /**
   * Exclude paths from documentation
   */
  exclude?: string[] | RegExp[]
}

/**
 * Default OpenAPI configuration
 */
const DEFAULT_CONFIG: OpenAPIConfig = {
  path: '/swagger',
  version: '3.1.0',
  documentation: {
    info: {
      title: 'ElysiaJS API',
      description: 'API Documentation',
      version: '1.0.0'
    }
  }
}

/**
 * Register OpenAPI plugin with the Elysia app
 * 
 * @example
 * ```typescript
 * import { registerOpenAPI } from '@igorcesarcode/elysiajs-di'
 * 
 * // After bootstrap
 * await registerOpenAPI(app, {
 *   path: '/docs',
 *   documentation: {
 *     info: {
 *       title: 'My API',
 *       version: '1.0.0'
 *     }
 *   }
 * })
 * ```
 */
export async function registerOpenAPI(
  app: Elysia,
  config: OpenAPIConfig = {}
): Promise<void> {
  const mergedConfig = {
    ...DEFAULT_CONFIG,
    ...config,
    documentation: {
      ...DEFAULT_CONFIG.documentation,
      ...config.documentation,
      info: {
        ...DEFAULT_CONFIG.documentation?.info,
        ...config.documentation?.info
      }
    }
  }

  try {
    // Dynamic import to handle optional dependency
    const { openapi } = await import('@elysiajs/openapi')

    const openapiConfig: Record<string, any> = {
      path: mergedConfig.path,
      documentation: mergedConfig.documentation
    }

    // Handle exclude option (paths to exclude from docs)
    if (mergedConfig.exclude) {
      openapiConfig.exclude = {
        paths: mergedConfig.exclude
      }
    }

    // Try to load zod-to-json-schema for Zod v3 support
    try {
      const { zodToJsonSchema } = await import('zod-to-json-schema')
      openapiConfig.mapJsonSchema = {
        zod: zodToJsonSchema
      }
      internalLogger.log('OpenAPIModule', 'Zod schema support enabled')
    } catch {
      internalLogger.warn(
        'OpenAPIModule',
        'zod-to-json-schema not found. Install it for Zod schema support: bun add zod-to-json-schema'
      )
    }

    app.use(openapi(openapiConfig))

    internalLogger.log('OpenAPIModule', `Swagger UI available at ${mergedConfig.path}`)
  } catch (error) {
    internalLogger.warn(
      'OpenAPIModule',
      'Failed to load @elysiajs/openapi. Install it with: bun add @elysiajs/openapi'
    )
    throw error
  }
}

/**
 * Create OpenAPI detail configuration for routes
 * 
 * @example
 * ```typescript
 * @Get('/', {
 *   ...createOpenAPIDetail({
 *     summary: 'Get all users',
 *     tags: ['Users'],
 *     security: [{ bearerAuth: [] }]
 *   })
 * })
 * ```
 */
export function createOpenAPIDetail(options: {
  summary?: string
  description?: string
  tags?: string[]
  deprecated?: boolean
  security?: Array<Record<string, string[]>>
  hide?: boolean
}) {
  return {
    detail: options
  }
}

/**
 * Helper to create security scheme configuration
 */
export const SecuritySchemes = {
  /**
   * Bearer JWT authentication
   */
  bearerAuth: {
    type: 'http' as const,
    scheme: 'bearer',
    bearerFormat: 'JWT'
  },

  /**
   * API Key in header
   */
  apiKeyHeader: (name: string = 'X-API-Key') => ({
    type: 'apiKey' as const,
    in: 'header',
    name
  }),

  /**
   * API Key in query
   */
  apiKeyQuery: (name: string = 'api_key') => ({
    type: 'apiKey' as const,
    in: 'query',
    name
  }),

  /**
   * Basic authentication
   */
  basicAuth: {
    type: 'http' as const,
    scheme: 'basic'
  }
}


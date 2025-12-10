/**
 * CORS Plugin Integration for ElysiaJS-DI
 * 
 * Provides Cross-Origin Resource Sharing (CORS) support using @elysiajs/cors
 */

import type { Elysia } from 'elysia'
import { internalLogger } from '../factory/internal-logger'

/**
 * CORS plugin configuration
 */
export interface CORSConfig {
  /**
   * Assign the Access-Control-Allow-Origin header
   * @default true (accept all origins)
   */
  origin?: boolean | string | RegExp | ((context: { request: Request; headers: Record<string, string | undefined> }) => boolean | void) | Array<string | RegExp | ((context: { request: Request; headers: Record<string, string | undefined> }) => boolean | void)>

  /**
   * Assign Access-Control-Allow-Methods header
   * @default '*' (accept all methods)
   */
  methods?: undefined | null | '' | '*' | string | string[]

  /**
   * Assign Access-Control-Allow-Headers header
   * @default '*' (accept all headers)
   */
  allowedHeaders?: string | string[]

  /**
   * Assign Access-Control-Exposed-Headers header
   * @default '*'
   */
  exposedHeaders?: string | string[]

  /**
   * Assign Access-Control-Allow-Credentials header
   * @default true
   */
  credentials?: boolean

  /**
   * Assign Access-Control-Max-Age header (duration in seconds)
   * @default 5
   */
  maxAge?: number

  /**
   * Add [OPTIONS] /* handler to handle preflight request
   * @default true
   */
  preflight?: boolean
}

/**
 * Register CORS plugin on Elysia app
 * 
 * @param app - Elysia app instance
 * @param config - CORS configuration
 * 
 * @example
 * ```typescript
 * import { registerCORS } from '@igorcesarcode/elysiajs-di'
 * 
 * await registerCORS(app, {
 *   origin: true,
 *   credentials: true,
 *   methods: ['GET', 'POST', 'PUT', 'DELETE']
 * })
 * ```
 */
export async function registerCORS(
  app: Elysia,
  config?: CORSConfig
): Promise<void> {
  try {
    const { cors } = await import('@elysiajs/cors')

    // Type assertion needed because CORSConfig is compatible but TypeScript can't infer it
    const corsPlugin = cors((config || {}) as Parameters<typeof cors>[0])

    app.use(corsPlugin)

    internalLogger.log('CORSPlugin', 'CORS plugin registered')
  } catch (error) {
    const err = error as { code?: string }
    if (err?.code === 'MODULE_NOT_FOUND') {
      throw new Error(
        '@elysiajs/cors is not installed. Please install it with: bun add @elysiajs/cors'
      )
    }
    throw error
  }
}


/**
 * JWT Plugin Integration for ElysiaJS-DI
 * 
 * Provides JWT authentication support using @elysiajs/jwt
 */

import type { Elysia } from 'elysia'
import { internalLogger } from '../factory/internal-logger'
import { container } from 'tsyringe'
import { JwtService } from '../services/jwt.service'

/**
 * JWT plugin configuration
 */
export interface JWTConfig {
  /**
   * Name to decorate method as (e.g., 'jwt' for Context.jwt)
   * @default 'jwt'
   */
  name?: string

  /**
   * JWT secret key (should be from environment variable)
   */
  secret: string

  /**
   * Algorithm to sign JWT with
   * @default 'HS256'
   */
  alg?: string

  /**
   * Type strict validation for JWT payload
   */
  schema?: unknown

  /**
   * JWT Issuer
   */
  iss?: string

  /**
   * JWT Subject
   */
  sub?: string

  /**
   * JWT Audience
   */
  aud?: string | string[]

  /**
   * JWT ID
   */
  jti?: string

  /**
   * JWT Not Before (Unix timestamp)
   */
  nbf?: number

  /**
   * JWT Expiration Time (Unix timestamp)
   */
  exp?: number

  /**
   * JWT Issued At (Unix timestamp)
   */
  iat?: number

  /**
   * Critical Header Parameter
   */
  crit?: string[]
}

/**
 * Register JWT plugin on Elysia app
 * 
 * @param app - Elysia app instance
 * @param config - JWT configuration
 * 
 * @example
 * ```typescript
 * import { registerJWT } from '@igorcesarcode/elysiajs-di'
 * 
 * await registerJWT(app, {
 *   secret: process.env.JWT_SECRET || 'my-secret-key',
 *   name: 'jwt'
 * })
 * ```
 */
/**
 * Create a JWT plugin instance (without applying to app)
 * Useful for creating plugin instances for controller plugins
 */
export async function createJWTPlugin(config: JWTConfig): Promise<Elysia> {
  const { jwt } = await import('@elysiajs/jwt')

  const jwtConfig = {
    name: config.name || 'jwt',
    secret: config.secret,
    ...(config.alg !== undefined && { alg: config.alg }),
    ...(config.schema !== undefined && { schema: config.schema }),
    ...(config.iss !== undefined && { iss: config.iss }),
    ...(config.sub !== undefined && { sub: config.sub }),
    ...(config.aud !== undefined && { aud: config.aud }),
    ...(config.jti !== undefined && { jti: config.jti }),
    ...(config.nbf !== undefined && { nbf: config.nbf }),
    ...(config.exp !== undefined && { exp: config.exp }),
    ...(config.crit !== undefined && { crit: config.crit })
  }

  // Type assertion needed because our config is compatible but TypeScript can't infer it
  return jwt(jwtConfig as Parameters<typeof jwt>[0])
}

export async function registerJWT(
  app: Elysia,
  config: JWTConfig
): Promise<Elysia> {
  try {
    const jwtPlugin = await createJWTPlugin(config)

    app.use(jwtPlugin)

    // Configure JwtService with plugin name
    const jwtService = container.resolve(JwtService)
    jwtService.setJwtPluginName(config.name || 'jwt')

    internalLogger.log('JWTPlugin', `JWT plugin registered with name: ${config.name || 'jwt'}`)

    // Return the plugin instance so it can be reused in controller plugins
    return jwtPlugin
  } catch (error) {
    const err = error as { code?: string }
    if (err?.code === 'MODULE_NOT_FOUND') {
      throw new Error(
        '@elysiajs/jwt is not installed. Please install it with: bun add @elysiajs/jwt'
      )
    }
    throw error
  }
}


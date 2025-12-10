import { Singleton } from '../decorators/di.decorator';

/**
 * JWT Service for signing and verifying JWT tokens
 * Wraps the @elysiajs/jwt plugin functionality
 */
@Singleton()
export class JwtService {
  private jwtPluginName: string = 'jwt'

  /**
   * Set the JWT plugin name (default: 'jwt')
   * Called automatically when JWT plugin is registered
   */
  setJwtPluginName(name: string): void {
    this.jwtPluginName = name
  }

  /**
   * Get JWT plugin from context
   */
  private getJwtPlugin(context: { [key: string]: unknown }): { sign: (payload: unknown) => Promise<string>; verify: (token: string) => Promise<unknown> } | null {
    // Try to get JWT plugin from context
    // The plugin name is set via setJwtPluginName() when registerJWT() is called
    // In Elysia, the JWT plugin adds an object to the context with the plugin name
    const jwtPlugin = context[this.jwtPluginName] as { sign?: (payload: unknown) => Promise<string>; verify?: (token: string) => Promise<unknown> } | undefined

    if (!jwtPlugin) {
      return null
    }

    // In Elysia JWT plugin, the context gets an object with sign and verify methods
    // The object should have sign and verify as methods directly
    if (typeof jwtPlugin === 'object' && jwtPlugin !== null) {
      // Check if it has the required methods
      const jwtObj = jwtPlugin as any

      // The JWT plugin object should have sign and verify as methods
      if (typeof jwtObj.sign === 'function' && typeof jwtObj.verify === 'function') {
        // Return the methods bound to the jwt object
        return {
          sign: jwtObj.sign.bind(jwtObj),
          verify: jwtObj.verify.bind(jwtObj)
        }
      }
    }

    return null
  }

  /**
   * Sign a JWT token with the given payload
   * @param payload - Data to encode in the token
   * @param context - Elysia context (must have JWT plugin)
   * @returns Signed JWT token
   * @throws Error if JWT plugin is not available in context
   */
  async sign(payload: Record<string, unknown>, context: { [key: string]: unknown }): Promise<string> {
    const jwtPlugin = this.getJwtPlugin(context)

    if (!jwtPlugin) {
      throw new Error(
        `JWT plugin '${this.jwtPluginName}' not found in context. ` +
        `Make sure to call registerJWT() before using JwtService and that the JWT plugin is applied to controller plugins.`
      )
    }

    try {
      return await jwtPlugin.sign(payload)
    } catch (error) {
      throw new Error(`Failed to sign JWT token: ${error instanceof Error ? error.message : String(error)}`)
    }
  }

  /**
   * Verify and decode a JWT token
   * @param token - JWT token to verify
   * @param context - Elysia context (must have JWT plugin)
   * @returns Decoded payload if valid, null if invalid
   * @throws Error if JWT plugin is not available (for guard error handling)
   */
  async verify(token: string, context: { [key: string]: unknown }): Promise<unknown | null> {
    const jwtPlugin = this.getJwtPlugin(context)

    if (!jwtPlugin) {
      // JWT plugin not found in context - this means it's not registered or not available
      // Throw error to allow guard to distinguish between "plugin not available" and "invalid token"
      throw new Error(`JWT plugin '${this.jwtPluginName}' not found in context. Make sure the JWT plugin is registered and applied to the route.`)
    }

    try {
      const verified = await jwtPlugin.verify(token)
      return verified || null
    } catch (error) {
      // Token verification failed (invalid token, expired, etc.)
      // Return null to indicate invalid token (not a plugin error)
      return null
    }
  }

  /**
   * Extract token from Authorization header
   * @param headers - Request headers
   * @returns Token if found, null otherwise
   */
  extractToken(headers: Record<string, string | undefined>): string | null {
    const authHeader = headers.authorization || headers.Authorization

    if (!authHeader) {
      return null
    }

    // Validate that the header starts with "Bearer"
    if (!/^Bearer\s+/i.test(authHeader)) {
      return null
    }

    const token = authHeader.replace(/^Bearer\s+/i, '').trim()

    return token || null
  }

  /**
   * Extract token from Elysia context
   * Handles multiple sources of headers (context.headers, context.request.headers, etc.)
   * @param context - Elysia context
   * @returns Token if found, null otherwise
   */
  extractTokenFromContext(context: {
    headers?: Record<string, string | undefined>
    request?: Request
    [key: string]: unknown
  }): string | null {
    // Try context.headers first
    const headers = context.headers || {}
    const requestHeaders = context.request?.headers

    // Merge both sources of headers (Elysia may use either)
    const allHeaders: Record<string, string | undefined> = { ...headers }

    // Add headers from request.headers if available
    if (requestHeaders) {
      if (requestHeaders instanceof Headers) {
        // Headers object - iterate and add to allHeaders
        requestHeaders.forEach((value, key) => {
          allHeaders[key.toLowerCase()] = value
        })
      } else if (typeof requestHeaders === 'object' && requestHeaders !== null) {
        // Plain object - merge directly
        Object.entries(requestHeaders).forEach(([key, value]) => {
          allHeaders[key.toLowerCase()] = String(value)
        })
      }
    }

    // Also check the raw request headers using get method
    if (context.request?.headers instanceof Headers) {
      const authHeader = context.request.headers.get('authorization') || context.request.headers.get('Authorization')
      if (authHeader) {
        allHeaders.authorization = authHeader
        allHeaders.Authorization = authHeader
      }
    }

    return this.extractToken(allHeaders)
  }

  /**
   * Verify token from Elysia context (convenience method)
   * @param context - Elysia context (must have JWT plugin)
   * @returns Decoded payload if valid, null if invalid
   */
  async verifyFromContext(context: { [key: string]: unknown }): Promise<unknown | null> {
    const token = this.extractTokenFromContext(context)

    if (!token) {
      return null
    }

    return this.verify(token, context)
  }
}


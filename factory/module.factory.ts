import { Elysia } from 'elysia'
import 'reflect-metadata'
import { container } from 'tsyringe'
import { CONTROLLER_BASE_PATH_KEY, MODULE_KEY, ROUTES_KEY } from '../decorators/constants'
import { getGuardsMetadata } from '../decorators/guards.decorator'
import { registerCORS } from '../plugins/cors.plugin'
import { registerCron } from '../plugins/cron.plugin'
import { registerJWT } from '../plugins/jwt.plugin'
import type {
  BootstrapOptions,
  Constructor,
  ErrorHandler,
  IModuleFactory,
  ModuleMetadata,
  RouteMetadata
} from '../types'
import {
  hasBeforeApplicationShutdown,
  hasOnApplicationBootstrap,
  hasOnApplicationShutdown,
  hasOnModuleDestroy,
  hasOnModuleInit
} from '../types'
import type { CanActivate, ExecutionContext } from '../types/guards'
import { internalLogger } from './internal-logger'

/**
 * Default paths to ignore in error logging (browser auto-requests)
 */
const DEFAULT_IGNORED_PATHS = [
  '/favicon.ico',
  '/robots.txt',
  '/apple-touch-icon.png',
  '/apple-touch-icon-precomposed.png'
]

/**
 * Registered instance info for lifecycle management
 */
interface RegisteredInstance {
  instance: any
  type: 'module' | 'controller' | 'provider'
  moduleClass: Constructor
}

/**
 * Factory class responsible for registering modules and bootstrapping the application
 * with full lifecycle management support.
 * 
 * Lifecycle Order:
 * 
 * BOOTSTRAP:
 * 1. Register all modules, controllers, and providers
 * 2. Call onModuleInit() on all instances
 * 3. Call onApplicationBootstrap() on all instances
 * 4. Start listeners (app.listen)
 * 
 * SHUTDOWN:
 * 1. Receive termination signal (SIGINT/SIGTERM)
 * 2. Call onModuleDestroy() on all instances
 * 3. Call beforeApplicationShutdown() on all instances
 * 4. Stop listeners
 * 5. Call onApplicationShutdown() on all instances
 * 6. Process exits
 * 
 * @example
 * ```typescript
 * const app = new Elysia()
 * const factory = new ModuleFactory()
 * await factory.bootstrap(AppModule, app)
 * 
 * app.listen(3000)
 * ```
 */
export class ModuleFactory implements IModuleFactory {
  private registeredModules = new Set<Constructor>()
  private registeredInstances: RegisteredInstance[] = []
  private isShuttingDown = false
  private mainApp: Elysia | null = null
  private jwtPluginConfig: import('../plugins/jwt.plugin').JWTConfig | null = null

  private options: BootstrapOptions = {
    verbose: true,
    logger: console.log,
    ignoredPaths: DEFAULT_IGNORED_PATHS,
    enableErrorHandling: true
  }

  /**
   * Default error handler
   */
  private defaultErrorHandler: ErrorHandler = ({ code, error, set, request, path }) => {
    if (code === 'NOT_FOUND') {
      const ignoredPaths = this.options.ignoredPaths || DEFAULT_IGNORED_PATHS

      // Silently handle ignored paths (favicon, etc.)
      if (ignoredPaths.includes(path)) {
        set.status = 404
        return
      }

      // Log real 404 errors
      internalLogger.warn('RouterExplorer', `Route not found: ${request.method} ${path}`)
      set.status = 404
      return { error: 'Route not found', path }
    }

    if (code === 'VALIDATION') {
      // Parse Zod validation error for cleaner output
      let validationDetails: any = null
      let errorMessage = error.message

      try {
        validationDetails = JSON.parse(error.message)
        // Extract clean error messages from Zod
        if (validationDetails.errors && Array.isArray(validationDetails.errors)) {
          const messages = validationDetails.errors.map((e: any) => {
            const field = e.path?.join('.') || validationDetails.property || 'unknown'
            return `${field}: ${e.message}`
          })
          errorMessage = messages.join(', ')
        } else if (validationDetails.message) {
          errorMessage = validationDetails.message
        }
      } catch {
        // If not JSON, use original message
      }

      internalLogger.error('ValidationPipe', `Validation failed - ${errorMessage}`)
      set.status = 400

      return {
        error: 'Validation error',
        message: errorMessage,
        details: validationDetails?.errors || []
      }
    }

    // Log all other errors
    internalLogger.error('ExceptionHandler', error.message)
    set.status = 500
    return { error: error.message }
  }

  /**
   * Setup error handling on the Elysia app
   */
  private setupErrorHandling(app: Elysia): void {
    if (!this.options.enableErrorHandling) {
      return
    }

    const handler = this.options.errorHandler || this.defaultErrorHandler

    app.onError((ctx: any) => {
      const path = new URL(ctx.request.url).pathname
      return handler({
        code: String(ctx.code),
        error: ctx.error as Error,
        set: ctx.set as any,
        request: ctx.request,
        path
      })
    })
  }

  /**
   * Setup shutdown signal handlers
   */
  private setupShutdownHandlers(): void {
    const shutdown = async (signal: string) => {
      if (this.isShuttingDown) return
      this.isShuttingDown = true

      console.log() // New line
      internalLogger.warn('ElysiaApplication', `Received ${signal}, starting graceful shutdown...`)

      try {
        // 1. Call onModuleDestroy on all instances
        await this.callLifecycleHook('onModuleDestroy')

        // 2. Call beforeApplicationShutdown on all instances
        await this.callLifecycleHookWithSignal('beforeApplicationShutdown', signal)

        // 3. Stop listeners (Elysia handles this automatically on process exit)

        // 4. Call onApplicationShutdown on all instances
        await this.callLifecycleHookWithSignal('onApplicationShutdown', signal)

        internalLogger.log('ElysiaApplication', 'Graceful shutdown completed')
        process.exit(0)
      } catch (error) {
        internalLogger.error('ElysiaApplication', `Error during shutdown: ${error}`)
        process.exit(1)
      }
    }

    process.on('SIGINT', () => shutdown('SIGINT'))
    process.on('SIGTERM', () => shutdown('SIGTERM'))
  }

  /**
   * Call a lifecycle hook on all registered instances
   */
  private async callLifecycleHook(hookName: 'onModuleInit' | 'onApplicationBootstrap' | 'onModuleDestroy'): Promise<void> {
    for (const { instance, moduleClass } of this.registeredInstances) {
      if (hookName === 'onModuleInit' && hasOnModuleInit(instance)) {
        await instance.onModuleInit()
      } else if (hookName === 'onApplicationBootstrap' && hasOnApplicationBootstrap(instance)) {
        await instance.onApplicationBootstrap()
      } else if (hookName === 'onModuleDestroy' && hasOnModuleDestroy(instance)) {
        internalLogger.log('InstanceDestroyer', `${moduleClass.name} instance destroyed`)
        await instance.onModuleDestroy()
      }
    }
  }

  /**
   * Call a lifecycle hook with signal parameter on all registered instances
   */
  private async callLifecycleHookWithSignal(
    hookName: 'beforeApplicationShutdown' | 'onApplicationShutdown',
    signal: string
  ): Promise<void> {
    for (const { instance, moduleClass } of this.registeredInstances) {
      if (hookName === 'beforeApplicationShutdown' && hasBeforeApplicationShutdown(instance)) {
        await instance.beforeApplicationShutdown(signal)
      } else if (hookName === 'onApplicationShutdown' && hasOnApplicationShutdown(instance)) {
        internalLogger.log('ShutdownHook', `${moduleClass.name} shutdown completed`)
        await instance.onApplicationShutdown(signal)
      }
    }
  }

  /**
   * Register an instance for lifecycle management
   */
  private registerInstance(instance: any, type: RegisteredInstance['type'], moduleClass: Constructor): void {
    this.registeredInstances.push({ instance, type, moduleClass })
  }

  /**
   * Register a module and all its dependencies
   * 
   * @param moduleClass - The module class to register
   * @param app - The Elysia app instance
   */
  async registerModule(moduleClass: Constructor, app: Elysia): Promise<void> {
    if (this.registeredModules.has(moduleClass)) {
      return
    }

    // Store reference to main app for plugin access
    if (!this.mainApp) {
      this.mainApp = app
    }

    this.registeredModules.add(moduleClass)

    const metadata: ModuleMetadata = Reflect.getMetadata(MODULE_KEY, moduleClass)

    if (!metadata) {
      throw new Error(
        `${moduleClass.name} is not a valid module. Use the @Module() decorator.`
      )
    }

    // 1. Register imported modules (recursively)
    if (metadata.imports) {
      for (const importedModule of metadata.imports) {
        await this.registerModule(importedModule, app)
      }
    }

    // 2. Register providers (services) in the DI container
    if (metadata.providers) {
      metadata.providers.forEach(provider => {
        if (!container.isRegistered(provider)) {
          container.register(provider, { useClass: provider })
        }
        // Resolve and register instance for lifecycle
        const instance = container.resolve(provider)
        this.registerInstance(instance, 'provider', provider)
      })
    }

    // 3. Auto-register plugins if configured
    if (metadata.plugins) {
      if (metadata.plugins.jwt) {
        // Register JWT plugin on main app and store the config for controller plugins
        await registerJWT(app, metadata.plugins.jwt)
        // Store config for creating new plugin instances for controller plugins
        this.jwtPluginConfig = metadata.plugins.jwt
        internalLogger.log('ModuleFactory', 'JWT plugin registered and config stored for controller plugins')
      }
      if (metadata.plugins.cors) {
        await registerCORS(app, metadata.plugins.cors)
      }
      if (metadata.plugins.cron) {
        await registerCron(app, metadata.plugins.cron)
      }
    }

    // 4. Register controllers and their routes using Elysia plugins
    if (metadata.controllers) {
      for (const controllerClass of metadata.controllers) {
        const controllerPlugin = await this.createControllerPlugin(controllerClass, moduleClass)
        app.use(controllerPlugin)
      }
    }

    // 5. Register module instance for lifecycle (if it has lifecycle hooks)
    const moduleInstance = new moduleClass()
    this.registerInstance(moduleInstance, 'module', moduleClass)

    // Log module initialization
    internalLogger.log('InstanceLoader', `${moduleClass.name} dependencies initialized`)
  }

  /**
   * Create an Elysia plugin for a controller
   */
  private async createControllerPlugin(controllerClass: Constructor, _parentModule: Constructor): Promise<Elysia> {
    const basePath = Reflect.getMetadata(CONTROLLER_BASE_PATH_KEY, controllerClass) || ''
    const routes: RouteMetadata[] = Reflect.getMetadata(ROUTES_KEY, controllerClass) || []

    // Register controller in the DI container if not already registered
    if (!container.isRegistered(controllerClass)) {
      container.register(controllerClass, { useClass: controllerClass })
    }

    // Resolve controller instance with all dependencies injected
    const controllerInstance = container.resolve(controllerClass)

    // Register controller instance for lifecycle
    this.registerInstance(controllerInstance, 'controller', controllerClass)

    // Create a new Elysia instance as a plugin
    // In Elysia, when you use app.use(plugin), the plugin should inherit context from parent
    // However, to ensure JWT plugin is available in guard context, we need to apply it explicitly
    // IMPORTANT: The JWT plugin must be applied BEFORE registering routes so it's available in the context
    const plugin = new Elysia()

    // Apply JWT plugin to controller plugin if it exists
    // This ensures JWT plugin is available in the context when guards are executed
    // We create a new instance for each controller plugin to ensure it works correctly
    // (Elysia plugins are tied to their app instance, so we can't reuse the main app's instance)
    if (this.jwtPluginConfig) {
      const { createJWTPlugin } = await import('../plugins/jwt.plugin')
      const jwtPlugin = await createJWTPlugin(this.jwtPluginConfig)
      plugin.use(jwtPlugin)
      internalLogger.log('ModuleFactory', `JWT plugin created and applied to ${controllerClass.name} plugin`)
    } else {
      internalLogger.warn('ModuleFactory', `Warning: JWT plugin not available for ${controllerClass.name}`)
    }

    // Log controller registration
    if (routes.length > 0) {
      internalLogger.log('RoutesResolver', `${controllerClass.name} {${basePath || '/'}}:`)
    }

    // Register each route
    routes.forEach(route => {
      const fullPath = basePath + route.path
      const handler = (controllerInstance as any)[route.handlerName].bind(controllerInstance)

      // Get guards for this route (from route metadata or method metadata)
      const guards = route.guards || getGuardsMetadata(controllerClass.prototype, route.handlerName) || []

      // Build route options with validation schemas and OpenAPI detail
      const routeConfig: Record<string, unknown> = {}

      if (route.options) {
        if (route.options.body) routeConfig.body = route.options.body
        if (route.options.params) routeConfig.params = route.options.params
        if (route.options.query) routeConfig.query = route.options.query
        if (route.options.headers) routeConfig.headers = route.options.headers
        if (route.options.response) routeConfig.response = route.options.response
        if (route.options.detail) routeConfig.detail = route.options.detail
      }

      // Create route handler with guard execution
      // The context will have JWT plugin attached by Elysia's plugin system
      // We ensure the context has access to all plugins from the main app
      const routeHandler = async (context: {
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
      }) => {
        // Execute guards if any
        if (guards.length > 0) {
          // Create execution context
          const executionContext: ExecutionContext = {
            context,
            handler: route.handlerName,
            controller: controllerClass,
            controllerInstance,
            data: {}
          }

          // Execute each guard in order
          for (const GuardClass of guards) {
            // Register guard in DI container if not already registered
            if (!container.isRegistered(GuardClass)) {
              container.register(GuardClass, { useClass: GuardClass })
            }

            // Resolve guard instance with dependencies
            const guard = container.resolve<CanActivate>(GuardClass)

            // Execute guard
            const canActivate = await guard.canActivate(executionContext)

            if (!canActivate) {
              // Preserve status code set by guard (401, 403, etc.)
              // If guard didn't set a status, default to 401
              if (!context.set.status) {
                context.set.status = 401
              }
              return { error: 'Unauthorized' }
            }
          }

          // Merge guard data into context for handler access
          if (executionContext.data) {
            Object.assign(context, executionContext.data)
          }
        }

        // Call original handler
        return handler(context)
      }

      // Register route in the plugin with or without validation
      if (Object.keys(routeConfig).length > 0) {
        ; (plugin as any)[route.method](fullPath, routeHandler, routeConfig)
      } else {
        ; (plugin as any)[route.method](fullPath, routeHandler)
      }

      // Log route mapping
      const guardsInfo = guards.length > 0 ? ` [${guards.length} guard(s)]` : ''
      internalLogger.log('RouterExplorer', `Mapped {${fullPath}, ${route.method.toUpperCase()}} route${guardsInfo}`)
    })

    return plugin
  }

  /**
   * Bootstrap the application with the root module
   * 
   * This method:
   * 1. Sets up error handling
   * 2. Registers all modules, controllers, and providers
   * 3. Calls onModuleInit() on all instances
   * 4. Calls onApplicationBootstrap() on all instances
   * 5. Sets up shutdown handlers for graceful termination
   * 
   * @param rootModule - The root module class
   * @param app - The Elysia app instance
   * @param options - Bootstrap options
   * 
   * @example
   * ```typescript
   * const factory = new ModuleFactory()
   * await factory.bootstrap(AppModule, app)
   * 
   * // With custom options
   * await factory.bootstrap(AppModule, app, {
   *   verbose: true,
   *   ignoredPaths: ['/favicon.ico', '/custom-path'],
   *   errorHandler: ({ code, error, set }) => {
   *     // Custom error handling
   *   }
   * })
   * ```
   */
  async bootstrap(rootModule: Constructor, app: Elysia, options?: BootstrapOptions): Promise<void> {
    // Merge options with defaults
    this.options = {
      ...this.options,
      ...options,
      ignoredPaths: [
        ...DEFAULT_IGNORED_PATHS,
        ...(options?.ignoredPaths || [])
      ]
    }

    // Configure internal logger
    internalLogger.setEnabled(this.options.verbose ?? true)
    internalLogger.resetTimer()

    // Phase 1: Log start
    internalLogger.log('ElysiaFactory', 'Starting Elysia application...')

    // Phase 2: Setup error handling
    this.setupErrorHandling(app)

    // Phase 3: Register all modules (this also registers controllers and providers)
    await this.registerModule(rootModule, app)

    // Phase 4: Call onModuleInit() on all instances
    await this.callLifecycleHook('onModuleInit')

    // Phase 5: Call onApplicationBootstrap() on all instances
    await this.callLifecycleHook('onApplicationBootstrap')

    // Phase 6: Setup shutdown handlers
    this.setupShutdownHandlers()

    // Log success
    internalLogger.log('ElysiaApplication', 'Elysia application successfully started')
  }

  /**
   * Reset the factory state (useful for testing)
   */
  reset(): void {
    this.registeredModules.clear()
    this.registeredInstances = []
    this.isShuttingDown = false
    this.mainApp = null
    this.jwtPluginConfig = null
    container.clearInstances()
  }

  /**
   * Get all registered modules
   */
  getRegisteredModules(): Constructor[] {
    return Array.from(this.registeredModules)
  }

  /**
   * Get all registered instances
   */
  getRegisteredInstances(): RegisteredInstance[] {
    return [...this.registeredInstances]
  }
}

/**
 * Create a new ModuleFactory instance
 */
export function createModuleFactory(): ModuleFactory {
  return new ModuleFactory()
}

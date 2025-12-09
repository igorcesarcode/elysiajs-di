import 'reflect-metadata'
import { Elysia } from 'elysia'
import { container } from 'tsyringe'
import { MODULE_KEY, ROUTES_KEY, CONTROLLER_BASE_PATH_KEY } from '../decorators/constants'
import type {
  ModuleMetadata,
  RouteMetadata,
  Constructor,
  IModuleFactory,
  BootstrapOptions,
  ErrorHandler
} from '../types'
import {
  hasOnModuleInit,
  hasOnApplicationBootstrap,
  hasOnModuleDestroy,
  hasBeforeApplicationShutdown,
  hasOnApplicationShutdown
} from '../types'
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
  registerModule(moduleClass: Constructor, app: Elysia): void {
    if (this.registeredModules.has(moduleClass)) {
      return
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
      metadata.imports.forEach(importedModule => {
        this.registerModule(importedModule, app)
      })
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

    // 3. Register controllers and their routes using Elysia plugins
    if (metadata.controllers) {
      metadata.controllers.forEach(controllerClass => {
        const controllerPlugin = this.createControllerPlugin(controllerClass, moduleClass)
        app.use(controllerPlugin)
      })
    }

    // 4. Register module instance for lifecycle (if it has lifecycle hooks)
    const moduleInstance = new moduleClass()
    this.registerInstance(moduleInstance, 'module', moduleClass)

    // Log module initialization
    internalLogger.log('InstanceLoader', `${moduleClass.name} dependencies initialized`)
  }

  /**
   * Create an Elysia plugin for a controller
   */
  private createControllerPlugin(controllerClass: Constructor, _parentModule: Constructor): Elysia {
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
    const plugin = new Elysia()

    // Log controller registration
    if (routes.length > 0) {
      internalLogger.log('RoutesResolver', `${controllerClass.name} {${basePath || '/'}}:`)
    }

    // Register each route
    routes.forEach(route => {
      const fullPath = basePath + route.path
      const handler = (controllerInstance as any)[route.handlerName].bind(controllerInstance)

      // Build route options with validation schemas and OpenAPI detail
      const routeConfig: Record<string, any> = {}

      if (route.options) {
        if (route.options.body) routeConfig.body = route.options.body
        if (route.options.params) routeConfig.params = route.options.params
        if (route.options.query) routeConfig.query = route.options.query
        if (route.options.headers) routeConfig.headers = route.options.headers
        if (route.options.response) routeConfig.response = route.options.response
        if (route.options.detail) routeConfig.detail = route.options.detail
      }

      // Register route in the plugin with or without validation
      if (Object.keys(routeConfig).length > 0) {
        ; (plugin as any)[route.method](fullPath, handler, routeConfig)
      } else {
        ; (plugin as any)[route.method](fullPath, handler)
      }

      // Log route mapping
      internalLogger.log('RouterExplorer', `Mapped {${fullPath}, ${route.method.toUpperCase()}} route`)
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
    this.registerModule(rootModule, app)

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

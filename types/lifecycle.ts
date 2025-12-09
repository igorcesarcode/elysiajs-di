/**
 * Lifecycle hooks interfaces
 * 
 * These interfaces allow modules, controllers, and providers to hook into
 * the application lifecycle events.
 */

/**
 * Interface for classes that need to run initialization logic
 * Called after the module's dependencies have been resolved
 */
export interface OnModuleInit {
  /**
   * Called once the module has been initialized
   * Use this for any setup that requires dependencies to be available
   */
  onModuleInit(): Promise<void> | void
}

/**
 * Interface for classes that need to run logic after all modules are initialized
 * Called after all modules have been initialized and the application is ready to start
 */
export interface OnApplicationBootstrap {
  /**
   * Called once all modules have been initialized
   * The application is about to start listening for connections
   */
  onApplicationBootstrap(): Promise<void> | void
}

/**
 * Interface for classes that need cleanup logic when module is being destroyed
 * Called when the application receives a termination signal
 */
export interface OnModuleDestroy {
  /**
   * Called when the module is being destroyed
   * Use this for cleanup logic like closing connections
   */
  onModuleDestroy(): Promise<void> | void
}

/**
 * Interface for classes that need to run logic before application shutdown
 * Called after onModuleDestroy but before listeners are stopped
 */
export interface BeforeApplicationShutdown {
  /**
   * Called before the application shuts down
   * @param signal - The signal that triggered the shutdown (e.g., 'SIGTERM', 'SIGINT')
   */
  beforeApplicationShutdown(signal?: string): Promise<void> | void
}

/**
 * Interface for classes that need to run logic during application shutdown
 * Called after all listeners have been stopped
 */
export interface OnApplicationShutdown {
  /**
   * Called when the application is shutting down
   * @param signal - The signal that triggered the shutdown
   */
  onApplicationShutdown(signal?: string): Promise<void> | void
}

/**
 * Type guard to check if an object implements OnModuleInit
 */
export function hasOnModuleInit(obj: any): obj is OnModuleInit {
  return obj && typeof obj.onModuleInit === 'function'
}

/**
 * Type guard to check if an object implements OnApplicationBootstrap
 */
export function hasOnApplicationBootstrap(obj: any): obj is OnApplicationBootstrap {
  return obj && typeof obj.onApplicationBootstrap === 'function'
}

/**
 * Type guard to check if an object implements OnModuleDestroy
 */
export function hasOnModuleDestroy(obj: any): obj is OnModuleDestroy {
  return obj && typeof obj.onModuleDestroy === 'function'
}

/**
 * Type guard to check if an object implements BeforeApplicationShutdown
 */
export function hasBeforeApplicationShutdown(obj: any): obj is BeforeApplicationShutdown {
  return obj && typeof obj.beforeApplicationShutdown === 'function'
}

/**
 * Type guard to check if an object implements OnApplicationShutdown
 */
export function hasOnApplicationShutdown(obj: any): obj is OnApplicationShutdown {
  return obj && typeof obj.onApplicationShutdown === 'function'
}


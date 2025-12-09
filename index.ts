/**
 * ElysiaJS Dependency Injection Library
 * 
 * A NestJS-inspired module system for Elysia with TSyringe for dependency injection
 * and full lifecycle management support.
 * 
 * @example
 * ```typescript
 * import { Elysia } from 'elysia'
 * import { 
 *   Module, 
 *   Controller, 
 *   Get, 
 *   Post, 
 *   Singleton,
 *   Injectable,
 *   ModuleFactory,
 *   ApplicationLogger,
 *   OnModuleInit,
 *   OnApplicationBootstrap
 * } from './lib/elysiajs-di'
 * 
 * // Service with lifecycle hooks and logger
 * @Singleton()
 * class UserService implements OnModuleInit {
 *   private readonly logger = new ApplicationLogger(UserService.name)
 *   
 *   async onModuleInit() {
 *     this.logger.log('UserService initialized')
 *   }
 *   
 *   findAll() { 
 *     this.logger.log('Fetching all users')
 *     return [] 
 *   }
 * }
 * 
 * // Controller
 * @Controller('/users')
 * class UserController {
 *   constructor(private userService: UserService) {}
 * 
 *   @Get()
 *   getAllUsers() {
 *     return this.userService.findAll()
 *   }
 * }
 * 
 * // Module
 * @Module({
 *   controllers: [UserController],
 *   providers: [UserService]
 * })
 * class UserModule {}
 * 
 * // Root Module
 * @Module({
 *   imports: [UserModule]
 * })
 * class AppModule {}
 * 
 * // Bootstrap
 * const app = new Elysia()
 * const factory = new ModuleFactory()
 * await factory.bootstrap(AppModule, app)
 * 
 * app.listen(3000)
 * ```
 * 
 * @packageDocumentation
 */

// Re-export reflect-metadata for convenience
import 'reflect-metadata'

// Types
export * from './types'

// Decorators
export {
  Module,
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Patch,
  Singleton,
  Injectable,
  ROUTES_KEY,
  MODULE_KEY,
  CONTROLLER_BASE_PATH_KEY
} from './decorators'

// Factory
export { ModuleFactory, createModuleFactory, ApplicationLogger } from './factory'

// Plugins (OpenAPI & OpenTelemetry)
export {
  registerOpenAPI,
  createOpenAPIDetail,
  SecuritySchemes,
  type OpenAPIConfig,
  registerOpenTelemetry,
  registerAxiomTelemetry,
  getCurrentSpan,
  type OpenTelemetryConfig,
  type AxiomConfig,
  type SpanProcessorConfig
} from './plugins'

// Re-export tsyringe container for advanced use cases
export { container } from 'tsyringe'

// Legacy exports (lowercase) - deprecated, use uppercase versions
export { singleton, injectable } from 'tsyringe'

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
  Controller, CONTROLLER_BASE_PATH_KEY, Delete, Get, Injectable, JWT, JWT_REQUIRED_KEY, Module, MODULE_KEY, Patch, Post,
  Put, ROUTES_KEY, Singleton
} from './decorators'

// Factory
export { ApplicationLogger, createModuleFactory, ModuleFactory } from './factory'

// Plugins (OpenAPI, OpenTelemetry, JWT, CORS, Cron)
export {
  createOpenAPIDetail, getCurrentSpan, registerAxiomTelemetry, registerCORS, registerCron, registerJWT, registerOpenAPI, registerOpenTelemetry, SecuritySchemes, type AxiomConfig, type CORSConfig, type CronConfig,
  type CronJob, type JWTConfig, type OpenAPIConfig, type OpenTelemetryConfig, type SpanProcessorConfig
} from './plugins'

// Re-export tsyringe container for advanced use cases
export { container } from 'tsyringe'

// Legacy exports (lowercase) - deprecated, use uppercase versions
export { injectable, singleton } from 'tsyringe'

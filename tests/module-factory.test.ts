import { describe, expect, it, beforeEach, mock } from 'bun:test'
import 'reflect-metadata'
import { Elysia } from 'elysia'
import { container } from 'tsyringe'
import {
  Module,
  Controller,
  Injectable,
  Get,
  ModuleFactory
} from '../index'

describe('ModuleFactory', () => {
  let factory: ModuleFactory
  let app: Elysia

  beforeEach(() => {
    container.clearInstances()
    factory = new ModuleFactory()
    app = new Elysia()
  })

  describe('bootstrap', () => {
    it('should bootstrap a simple module', async () => {
      @Module({})
      class AppModule {}

      await factory.bootstrap(AppModule, app)

      const modules = factory.getRegisteredModules()
      expect(modules).toContain(AppModule)
    })

    it('should register controllers', async () => {
      @Controller('/test')
      class TestController {
        @Get('/')
        index() {
          return { message: 'ok' }
        }
      }

      @Module({
        controllers: [TestController]
      })
      class AppModule {}

      await factory.bootstrap(AppModule, app)

      const instances = factory.getRegisteredInstances()
      const controllerInstance = instances.find(i => i.type === 'controller')

      expect(controllerInstance).toBeDefined()
    })

    it('should register providers', async () => {
      @Injectable()
      class TestService {
        getValue() {
          return 'test'
        }
      }

      @Module({
        providers: [TestService]
      })
      class AppModule {}

      await factory.bootstrap(AppModule, app)

      const instances = factory.getRegisteredInstances()
      const providerInstance = instances.find(i => i.type === 'provider')

      expect(providerInstance).toBeDefined()
    })

    it('should register imported modules', async () => {
      @Injectable()
      class SharedService {}

      @Module({
        providers: [SharedService],
        exports: [SharedService]
      })
      class SharedModule {}

      @Module({
        imports: [SharedModule]
      })
      class AppModule {}

      await factory.bootstrap(AppModule, app)

      const modules = factory.getRegisteredModules()
      expect(modules).toContain(SharedModule)
      expect(modules).toContain(AppModule)
    })

    it('should inject dependencies into controllers', async () => {
      @Injectable()
      class UserService {
        getUsers() {
          return [{ id: 1, name: 'Test' }]
        }
      }

      @Controller('/users')
      class UserController {
        constructor(private userService: UserService) {}

        @Get('/')
        findAll() {
          return this.userService.getUsers()
        }
      }

      @Module({
        controllers: [UserController],
        providers: [UserService]
      })
      class AppModule {}

      await factory.bootstrap(AppModule, app)

      const instances = factory.getRegisteredInstances()
      const controllerInstance = instances.find(
        i => i.type === 'controller'
      )?.instance

      expect(controllerInstance).toBeDefined()
      expect(controllerInstance.findAll()).toEqual([{ id: 1, name: 'Test' }])
    })

    it('should throw error for class without @Module decorator', async () => {
      class InvalidModule {}

      await expect(factory.bootstrap(InvalidModule, app)).rejects.toThrow(
        'InvalidModule is not a valid module'
      )
    })
  })

  describe('reset', () => {
    it('should clear all registered modules and instances', async () => {
      @Module({})
      class AppModule {}

      await factory.bootstrap(AppModule, app)
      expect(factory.getRegisteredModules().length).toBeGreaterThan(0)

      factory.reset()

      expect(factory.getRegisteredModules()).toHaveLength(0)
      expect(factory.getRegisteredInstances()).toHaveLength(0)
    })
  })
})


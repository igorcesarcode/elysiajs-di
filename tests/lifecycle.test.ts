import { describe, expect, it, beforeEach, mock, spyOn } from 'bun:test'
import 'reflect-metadata'
import { Elysia } from 'elysia'
import { container } from 'tsyringe'
import {
  Module,
  Controller,
  Injectable,
  Get,
  ModuleFactory,
  OnModuleInit,
  OnApplicationBootstrap,
  OnModuleDestroy,
  BeforeApplicationShutdown,
  OnApplicationShutdown
} from '../index'

describe('Lifecycle Hooks', () => {
  let factory: ModuleFactory
  let app: Elysia

  beforeEach(() => {
    container.clearInstances()
    factory = new ModuleFactory()
    app = new Elysia()
  })

  describe('OnModuleInit', () => {
    it('should call onModuleInit on providers', async () => {
      const initMock = mock(() => {})

      @Injectable()
      class TestService implements OnModuleInit {
        onModuleInit() {
          initMock()
        }
      }

      @Module({
        providers: [TestService]
      })
      class AppModule {}

      await factory.bootstrap(AppModule, app)

      expect(initMock).toHaveBeenCalled()
    })

    it('should call onModuleInit on controllers', async () => {
      const initMock = mock(() => {})

      @Controller('/test')
      class TestController implements OnModuleInit {
        @Get('/')
        index() {
          return {}
        }

        onModuleInit() {
          initMock()
        }
      }

      @Module({
        controllers: [TestController]
      })
      class AppModule {}

      await factory.bootstrap(AppModule, app)

      expect(initMock).toHaveBeenCalled()
    })
  })

  describe('OnApplicationBootstrap', () => {
    it('should call onApplicationBootstrap after all modules initialized', async () => {
      const bootstrapMock = mock(() => {})

      @Injectable()
      class TestService implements OnApplicationBootstrap {
        onApplicationBootstrap() {
          bootstrapMock()
        }
      }

      @Module({
        providers: [TestService]
      })
      class AppModule {}

      await factory.bootstrap(AppModule, app)

      expect(bootstrapMock).toHaveBeenCalled()
    })
  })

  describe('Lifecycle order', () => {
    it('should call lifecycle hooks in correct order', async () => {
      const callOrder: string[] = []

      @Injectable()
      class TestService implements OnModuleInit, OnApplicationBootstrap {
        onModuleInit() {
          callOrder.push('onModuleInit')
        }

        onApplicationBootstrap() {
          callOrder.push('onApplicationBootstrap')
        }
      }

      @Module({
        providers: [TestService]
      })
      class AppModule {}

      await factory.bootstrap(AppModule, app)

      expect(callOrder).toEqual(['onModuleInit', 'onApplicationBootstrap'])
    })
  })
})


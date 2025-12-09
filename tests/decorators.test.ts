import { describe, expect, it, beforeEach } from 'bun:test'
import 'reflect-metadata'
import { container } from 'tsyringe'
import {
  Module,
  Controller,
  Injectable,
  Get,
  Post,
  Put,
  Delete,
  Patch
} from '../index'
import {
  MODULE_KEY,
  CONTROLLER_BASE_PATH_KEY,
  ROUTES_KEY
} from '../decorators/constants'
import type { ModuleMetadata, RouteMetadata } from '../types'

describe('Decorators', () => {
  beforeEach(() => {
    container.clearInstances()
  })

  describe('@Module', () => {
    it('should define module metadata', () => {
      @Injectable()
      class TestService {}

      @Controller('/test')
      class TestController {}

      @Module({
        controllers: [TestController],
        providers: [TestService]
      })
      class TestModule {}

      const metadata: ModuleMetadata = Reflect.getMetadata(MODULE_KEY, TestModule)

      expect(metadata).toBeDefined()
      expect(metadata.controllers).toContain(TestController)
      expect(metadata.providers).toContain(TestService)
    })

    it('should support imports', () => {
      @Module({})
      class SharedModule {}

      @Module({
        imports: [SharedModule]
      })
      class AppModule {}

      const metadata: ModuleMetadata = Reflect.getMetadata(MODULE_KEY, AppModule)

      expect(metadata.imports).toContain(SharedModule)
    })

    it('should support exports', () => {
      @Injectable()
      class SharedService {}

      @Module({
        providers: [SharedService],
        exports: [SharedService]
      })
      class SharedModule {}

      const metadata: ModuleMetadata = Reflect.getMetadata(MODULE_KEY, SharedModule)

      expect(metadata.exports).toContain(SharedService)
    })
  })

  describe('@Controller', () => {
    it('should define controller base path', () => {
      @Controller('/users')
      class UserController {}

      const basePath = Reflect.getMetadata(CONTROLLER_BASE_PATH_KEY, UserController)

      expect(basePath).toBe('/users')
    })

    it('should default to empty path', () => {
      @Controller()
      class RootController {}

      const basePath = Reflect.getMetadata(CONTROLLER_BASE_PATH_KEY, RootController)

      expect(basePath).toBe('')
    })
  })

  describe('@Injectable', () => {
    it('should allow class to be resolved by container', () => {
      @Injectable()
      class TestService {
        getValue() {
          return 'test'
        }
      }

      container.register(TestService, { useClass: TestService })
      const instance = container.resolve(TestService)

      expect(instance).toBeInstanceOf(TestService)
      expect(instance.getValue()).toBe('test')
    })

    it('should support dependency injection', () => {
      @Injectable()
      class DependencyService {
        getValue() {
          return 'dependency'
        }
      }

      @Injectable()
      class MainService {
        constructor(private dep: DependencyService) {}

        getCombinedValue() {
          return `main-${this.dep.getValue()}`
        }
      }

      container.register(DependencyService, { useClass: DependencyService })
      container.register(MainService, { useClass: MainService })

      const instance = container.resolve(MainService)

      expect(instance.getCombinedValue()).toBe('main-dependency')
    })
  })

  describe('HTTP Method Decorators', () => {
    it('@Get should define GET route', () => {
      @Controller('/api')
      class TestController {
        @Get('/items')
        getItems() {
          return []
        }
      }

      const routes: RouteMetadata[] = Reflect.getMetadata(ROUTES_KEY, TestController)

      expect(routes).toHaveLength(1)
      expect(routes[0].method).toBe('get')
      expect(routes[0].path).toBe('/items')
      expect(routes[0].handlerName).toBe('getItems')
    })

    it('@Post should define POST route', () => {
      @Controller('/api')
      class TestController {
        @Post('/items')
        createItem() {
          return {}
        }
      }

      const routes: RouteMetadata[] = Reflect.getMetadata(ROUTES_KEY, TestController)

      expect(routes[0].method).toBe('post')
    })

    it('@Put should define PUT route', () => {
      @Controller('/api')
      class TestController {
        @Put('/items/:id')
        updateItem() {
          return {}
        }
      }

      const routes: RouteMetadata[] = Reflect.getMetadata(ROUTES_KEY, TestController)

      expect(routes[0].method).toBe('put')
    })

    it('@Delete should define DELETE route', () => {
      @Controller('/api')
      class TestController {
        @Delete('/items/:id')
        deleteItem() {
          return {}
        }
      }

      const routes: RouteMetadata[] = Reflect.getMetadata(ROUTES_KEY, TestController)

      expect(routes[0].method).toBe('delete')
    })

    it('@Patch should define PATCH route', () => {
      @Controller('/api')
      class TestController {
        @Patch('/items/:id')
        patchItem() {
          return {}
        }
      }

      const routes: RouteMetadata[] = Reflect.getMetadata(ROUTES_KEY, TestController)

      expect(routes[0].method).toBe('patch')
    })

    it('should support route options with validation', () => {
      const { z } = require('zod')

      @Controller('/api')
      class TestController {
        @Post('/items', {
          body: z.object({ name: z.string() })
        })
        createItem() {
          return {}
        }
      }

      const routes: RouteMetadata[] = Reflect.getMetadata(ROUTES_KEY, TestController)

      expect(routes[0].options).toBeDefined()
      expect(routes[0].options?.body).toBeDefined()
    })

    it('should support route options with OpenAPI detail', () => {
      @Controller('/api')
      class TestController {
        @Get('/items', {
          detail: {
            tags: ['Items'],
            summary: 'Get all items'
          }
        })
        getItems() {
          return []
        }
      }

      const routes: RouteMetadata[] = Reflect.getMetadata(ROUTES_KEY, TestController)

      expect(routes[0].options?.detail).toBeDefined()
      expect(routes[0].options?.detail?.tags).toContain('Items')
      expect(routes[0].options?.detail?.summary).toBe('Get all items')
    })

    it('should support multiple routes on same controller', () => {
      @Controller('/users')
      class UserController {
        @Get('/')
        findAll() {
          return []
        }

        @Get('/:id')
        findOne() {
          return {}
        }

        @Post('/')
        create() {
          return {}
        }

        @Put('/:id')
        update() {
          return {}
        }

        @Delete('/:id')
        remove() {
          return {}
        }
      }

      const routes: RouteMetadata[] = Reflect.getMetadata(ROUTES_KEY, UserController)

      expect(routes).toHaveLength(5)
    })
  })
})


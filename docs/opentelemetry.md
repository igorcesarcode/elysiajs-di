# OpenTelemetry Integration

ElysiaJS-DI provides seamless integration with `@elysiajs/opentelemetry` for distributed tracing and observability.

## Installation

### Basic (internal tracing only)

```bash
bun add @elysiajs/opentelemetry
```

### With trace export (Jaeger, Axiom, Grafana, etc.)

```bash
bun add @elysiajs/opentelemetry @opentelemetry/sdk-trace-node @opentelemetry/exporter-trace-otlp-proto
```

> **Note:** `@opentelemetry/sdk-trace-node` and `@opentelemetry/exporter-trace-otlp-proto` are only required if you want to **export traces** to a backend like Jaeger, Axiom, or Grafana Tempo.

## Basic Setup

```typescript
import { Elysia } from "elysia";
import {
  ModuleFactory,
  registerOpenTelemetry,
} from "@igorcesarcode/elysiajs-di";
import { AppModule } from "./app.module";

const app = new Elysia();
const factory = new ModuleFactory();

// Register OpenTelemetry BEFORE bootstrap for proper instrumentation
await registerOpenTelemetry(app, {
  serviceName: "my-api",
});

// Bootstrap your application
await factory.bootstrap(AppModule, app);

app.listen(3000);
```

## Configuration Options

```typescript
interface OpenTelemetryConfig {
  // Service name for tracing
  serviceName?: string; // default: 'elysia-app'

  // OTLP exporter configuration
  exporter?: {
    url?: string;
    headers?: Record<string, string>;
  };

  // Additional instrumentations
  instrumentations?: any[];

  // Custom span processors
  spanProcessors?: any[];
}
```

## Exporting to OTLP Collector

```typescript
await registerOpenTelemetry(app, {
  serviceName: "my-api",
  exporter: {
    url: "http://localhost:4318/v1/traces",
  },
});
```

## Axiom Integration

Export traces directly to Axiom:

```typescript
import { registerAxiomTelemetry } from "@igorcesarcode/elysiajs-di";

await registerAxiomTelemetry(app, {
  token: process.env.AXIOM_TOKEN!,
  dataset: process.env.AXIOM_DATASET!,
  serviceName: "my-api",
});
```

## Jaeger Integration

```typescript
await registerOpenTelemetry(app, {
  serviceName: "my-api",
  exporter: {
    url: "http://localhost:14268/api/traces",
  },
});
```

## Custom Span Attributes

Add custom attributes to the current span:

```typescript
import {
  getCurrentSpan,
  Singleton,
  ApplicationLogger,
} from "@igorcesarcode/elysiajs-di";

@Singleton()
class OrderService {
  private readonly logger = new ApplicationLogger(OrderService.name);

  async processOrder(orderId: string) {
    const span = await getCurrentSpan();

    span?.setAttributes({
      "order.id": orderId,
      "order.status": "processing",
    });

    this.logger.log(`Processing order ${orderId}`);

    // Process order...

    span?.setAttributes({
      "order.status": "completed",
    });
  }
}
```

## Named Functions for Better Traces

Use named functions in hooks for clearer span names:

```typescript
// ❌ Bad - span name will be "anonymous"
.derive(async ({ cookie }) => {
  return { user: await getUser(cookie.session) }
})

// ✅ Good - span name will be "getProfile"
.derive(async function getProfile({ cookie }) {
  return { user: await getUser(cookie.session) }
})
```

## Database Instrumentation

Add database instrumentation (e.g., PostgreSQL):

```typescript
import { PgInstrumentation } from "@opentelemetry/instrumentation-pg";

await registerOpenTelemetry(app, {
  serviceName: "my-api",
  instrumentations: [new PgInstrumentation()],
  exporter: {
    url: "http://localhost:4318/v1/traces",
  },
});
```

## Complete Example

```typescript
import { Elysia } from "elysia";
import {
  Module,
  Controller,
  Get,
  Post,
  Singleton,
  ModuleFactory,
  ApplicationLogger,
  registerOpenTelemetry,
  getCurrentSpan,
} from "@igorcesarcode/elysiajs-di";

// Service with tracing
@Singleton()
class UserService {
  private readonly logger = new ApplicationLogger(UserService.name);
  private users = [{ id: 1, name: "John" }];

  async findAll() {
    const span = await getCurrentSpan();
    span?.setAttributes({ "users.count": this.users.length });

    this.logger.log("Fetching all users");
    return this.users;
  }

  async findById(id: number) {
    const span = await getCurrentSpan();
    span?.setAttributes({ "user.id": id });

    this.logger.log(`Fetching user ${id}`);
    return this.users.find((u) => u.id === id);
  }
}

// Controller
@Controller("/users")
class UserController {
  constructor(private userService: UserService) {}

  @Get()
  findAll() {
    return this.userService.findAll();
  }

  @Get("/:id")
  findById({ params }) {
    return this.userService.findById(Number(params.id));
  }
}

// Module
@Module({
  controllers: [UserController],
  providers: [UserService],
})
class UserModule {}

@Module({ imports: [UserModule] })
class AppModule {}

// Bootstrap with telemetry
const app = new Elysia();
const factory = new ModuleFactory();

// Enable telemetry FIRST
await registerOpenTelemetry(app, {
  serviceName: "user-service",
  exporter: {
    url: process.env.OTEL_EXPORTER_URL || "http://localhost:4318/v1/traces",
  },
});

// Then bootstrap
await factory.bootstrap(AppModule, app);

app.listen(3000, () => {
  console.log("🚀 Server with OpenTelemetry running at http://localhost:3000");
});
```

## Environment Variables

Configure OpenTelemetry via environment:

```bash
# Resource detectors
export OTEL_NODE_RESOURCE_DETECTORS="env,host"

# Service name
export OTEL_SERVICE_NAME="my-api"

# Exporter endpoint
export OTEL_EXPORTER_OTLP_ENDPOINT="http://localhost:4318"
```

## Viewing Traces

### Jaeger UI

Run Jaeger locally:

```bash
docker run -d --name jaeger \
  -p 16686:16686 \
  -p 14268:14268 \
  jaegertracing/all-in-one:latest
```

Access at: http://localhost:16686

### Grafana Tempo

Configure as OTLP backend and view in Grafana.

### Axiom

View traces in your Axiom dashboard after configuring with `registerAxiomTelemetry`.

## Troubleshooting

### Plugin not found

```
Failed to load @elysiajs/opentelemetry
```

**Solution:** Install all required packages:

```bash
bun add @elysiajs/opentelemetry @opentelemetry/sdk-trace-node @opentelemetry/exporter-trace-otlp-proto
```

### Traces not appearing

1. Ensure OpenTelemetry is registered **before** `factory.bootstrap()`
2. Check your exporter URL is correct
3. Verify your collector is running

### Anonymous span names

Use named functions instead of arrow functions in hooks and middleware.

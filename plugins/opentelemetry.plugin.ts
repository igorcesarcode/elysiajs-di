/**
 * OpenTelemetry Plugin Integration for ElysiaJS-DI
 * 
 * Provides distributed tracing and observability
 */

import type { Elysia } from 'elysia'
import { internalLogger } from '../factory/internal-logger'

/**
 * Span processor configuration
 */
export interface SpanProcessorConfig {
  /**
   * OTLP exporter URL
   */
  url?: string

  /**
   * Custom headers for the exporter
   */
  headers?: Record<string, string>
}

/**
 * OpenTelemetry configuration
 */
export interface OpenTelemetryConfig {
  /**
   * Service name for tracing
   */
  serviceName?: string

  /**
   * OTLP exporter configuration
   */
  exporter?: SpanProcessorConfig

  /**
   * Additional instrumentations to enable
   */
  instrumentations?: any[]

  /**
   * Custom span processors
   */
  spanProcessors?: any[]
}

/**
 * Axiom-specific configuration
 */
export interface AxiomConfig {
  /**
   * Axiom API token
   */
  token: string

  /**
   * Axiom dataset name
   */
  dataset: string

  /**
   * Service name
   */
  serviceName?: string
}

/**
 * Default OpenTelemetry configuration
 */
const DEFAULT_CONFIG: OpenTelemetryConfig = {
  serviceName: 'elysia-app'
}

/**
 * Register OpenTelemetry plugin with the Elysia app
 * 
 * @example
 * ```typescript
 * import { registerOpenTelemetry } from '@igorcesarcode/elysiajs-di'
 * 
 * // Basic setup
 * await registerOpenTelemetry(app)
 * 
 * // With OTLP exporter
 * await registerOpenTelemetry(app, {
 *   serviceName: 'my-api',
 *   exporter: {
 *     url: 'http://localhost:4318/v1/traces'
 *   }
 * })
 * ```
 */
export async function registerOpenTelemetry(
  app: Elysia,
  config: OpenTelemetryConfig = {}
): Promise<void> {
  const mergedConfig = { ...DEFAULT_CONFIG, ...config }

  try {
    const { opentelemetry } = await import('@elysiajs/opentelemetry')

    const pluginConfig: any = {}

    if (mergedConfig.instrumentations) {
      pluginConfig.instrumentations = mergedConfig.instrumentations
    }

    // If exporter config is provided, set up span processors
    if (mergedConfig.exporter?.url || mergedConfig.spanProcessors) {
      if (mergedConfig.spanProcessors) {
        pluginConfig.spanProcessors = mergedConfig.spanProcessors
      } else if (mergedConfig.exporter?.url) {
        try {
          const { BatchSpanProcessor } = await import('@opentelemetry/sdk-trace-node')
          const { OTLPTraceExporter } = await import('@opentelemetry/exporter-trace-otlp-proto')

          pluginConfig.spanProcessors = [
            new BatchSpanProcessor(
              new OTLPTraceExporter({
                url: mergedConfig.exporter.url,
                headers: mergedConfig.exporter.headers
              })
            )
          ]
        } catch {
          internalLogger.warn(
            'OpenTelemetryModule',
            'Failed to load OpenTelemetry exporters. Install: bun add @opentelemetry/sdk-trace-node @opentelemetry/exporter-trace-otlp-proto'
          )
        }
      }
    }

    app.use(opentelemetry(pluginConfig))

    internalLogger.log('OpenTelemetryModule', `Tracing enabled for service: ${mergedConfig.serviceName}`)
  } catch (error) {
    internalLogger.warn(
      'OpenTelemetryModule',
      'Failed to load @elysiajs/opentelemetry. Install it with: bun add @elysiajs/opentelemetry'
    )
    throw error
  }
}

/**
 * Register OpenTelemetry with Axiom backend
 * 
 * @example
 * ```typescript
 * await registerAxiomTelemetry(app, {
 *   token: process.env.AXIOM_TOKEN!,
 *   dataset: process.env.AXIOM_DATASET!,
 *   serviceName: 'my-api'
 * })
 * ```
 */
export async function registerAxiomTelemetry(
  app: Elysia,
  config: AxiomConfig
): Promise<void> {
  await registerOpenTelemetry(app, {
    serviceName: config.serviceName || 'elysia-app',
    exporter: {
      url: 'https://api.axiom.co/v1/traces',
      headers: {
        'Authorization': `Bearer ${config.token}`,
        'X-Axiom-Dataset': config.dataset
      }
    }
  })
}

/**
 * Get the current span for adding custom attributes
 * Re-exported from @elysiajs/opentelemetry for convenience
 * 
 * @example
 * ```typescript
 * import { getCurrentSpan } from '@igorcesarcode/elysiajs-di'
 * 
 * function processOrder(orderId: string) {
 *   const span = getCurrentSpan()
 *   span?.setAttributes({
 *     'order.id': orderId,
 *     'order.status': 'processing'
 *   })
 * }
 * ```
 */
export async function getCurrentSpan(): Promise<any> {
  try {
    const { getCurrentSpan: getSpan } = await import('@elysiajs/opentelemetry')
    return getSpan()
  } catch {
    return null
  }
}


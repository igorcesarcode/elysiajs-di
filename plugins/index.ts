/**
 * ElysiaJS-DI Plugins
 * 
 * Optional integrations for OpenAPI and OpenTelemetry
 */

export {
  registerOpenAPI,
  createOpenAPIDetail,
  SecuritySchemes,
  type OpenAPIConfig
} from './openapi.plugin'

export {
  registerOpenTelemetry,
  registerAxiomTelemetry,
  getCurrentSpan,
  type OpenTelemetryConfig,
  type AxiomConfig,
  type SpanProcessorConfig
} from './opentelemetry.plugin'


/**
 * ElysiaJS-DI Plugins
 * 
 * Optional integrations for OpenAPI, OpenTelemetry, JWT, CORS, and Cron
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

export {
  registerJWT,
  type JWTConfig
} from './jwt.plugin'

export {
  registerCORS,
  type CORSConfig
} from './cors.plugin'

export {
  registerCron,
  type CronConfig,
  type CronJob
} from './cron.plugin'


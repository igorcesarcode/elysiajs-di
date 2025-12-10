/**
 * Cron Plugin Integration for ElysiaJS-DI
 * 
 * Provides scheduled task support using @elysiajs/cron
 */

import type { Elysia } from 'elysia'
import { internalLogger } from '../factory/internal-logger'


/**
 * Cron job definition
 */
export interface CronJob {
  /**
   * Cron expression (e.g., '0 0 * * *' for daily at midnight)
   */
  cron: string

  /**
   * Name of the cron job
   */
  name: string

  /**
   * Handler function to execute
   */
  run: () => void | Promise<void>

  /**
   * Timezone for the cron job
   */
  timezone?: string

  /**
   * Run the job on initialization
   * @default false
   */
  runOnInit?: boolean
}

/**
 * Cron plugin configuration
 */
export interface CronConfig {
  /**
   * Array of cron jobs to register
   */
  jobs: CronJob[]
}

/**
 * Register Cron plugin on Elysia app
 * 
 * @param app - Elysia app instance
 * @param config - Cron configuration with jobs
 * 
 * @example
 * ```typescript
 * import { registerCron } from '@igorcesarcode/elysiajs-di'
 * 
 * await registerCron(app, {
 *   jobs: [
 *     {
 *       name: 'cleanup',
 *       cron: '0 0 * * *',
 *       run: async () => {
 *         console.log('Running cleanup job')
 *       }
 *     }
 *   ]
 * })
 * ```
 */
export async function registerCron(
  app: Elysia,
  config: CronConfig
): Promise<void> {
  try {
    const { cron } = await import('@elysiajs/cron')

    for (const job of config.jobs) {
      const cronConfig = {
        name: job.name,
        pattern: job.cron,
        run: job.run,
        ...(job.timezone !== undefined && { timezone: job.timezone }),
        ...(job.runOnInit !== undefined && { runOnInit: job.runOnInit })
      }

      // Type assertion needed because our config is compatible but TypeScript can't infer it
      const cronPlugin = cron(cronConfig as Parameters<typeof cron>[0])

      app.use(cronPlugin)
    }

    internalLogger.log('CronPlugin', `Registered ${config.jobs.length} cron job(s)`)
  } catch (error) {
    const err = error as { code?: string }
    if (err?.code === 'MODULE_NOT_FOUND') {
      throw new Error(
        '@elysiajs/cron is not installed. Please install it with: bun add @elysiajs/cron'
      )
    }
    throw error
  }
}


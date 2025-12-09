/**
 * Internal Logger - NestJS-style logging for the DI framework
 */

// ANSI color codes
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  dim: '\x1b[2m',

  // Text colors
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  red: '\x1b[31m',
  cyan: '\x1b[36m',
  magenta: '\x1b[35m',
  white: '\x1b[37m',
}

type LogLevel = 'LOG' | 'WARN' | 'ERROR' | 'DEBUG' | 'VERBOSE'

export class InternalLogger {
  private static instance: InternalLogger
  private lastLogTime: number = Date.now()
  private appName: string = 'Elysia'
  private pid: number = process.pid
  private enabled: boolean = true

  private constructor() { }

  static getInstance(): InternalLogger {
    if (!InternalLogger.instance) {
      InternalLogger.instance = new InternalLogger()
    }
    return InternalLogger.instance
  }

  setEnabled(enabled: boolean): void {
    this.enabled = enabled
  }

  setAppName(name: string): void {
    this.appName = name
  }

  private getTimestamp(): string {
    const now = new Date()
    return now.toLocaleString('en-US', {
      month: '2-digit',
      day: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    }).replace(',', ' -')
  }

  private getElapsedTime(): string {
    const now = Date.now()
    const elapsed = now - this.lastLogTime
    this.lastLogTime = now
    return `+${elapsed}ms`
  }

  private getLevelColor(level: LogLevel): string {
    switch (level) {
      case 'LOG': return colors.green
      case 'WARN': return colors.yellow
      case 'ERROR': return colors.red
      case 'DEBUG': return colors.magenta
      case 'VERBOSE': return colors.cyan
      default: return colors.white
    }
  }

  private formatMessage(level: LogLevel, context: string, message: string, showTime: boolean = true): string {
    const timestamp = this.getTimestamp()
    const elapsed = showTime ? ` ${colors.yellow}${this.getElapsedTime()}${colors.reset}` : ''
    const levelColor = this.getLevelColor(level)
    const levelPadded = level.padEnd(5)

    // Use level color for message on ERROR and WARN
    const messageColor = level === 'ERROR' || level === 'WARN' ? levelColor : colors.green

    return `${colors.green}[${this.appName}]${colors.reset} ` +
      `${colors.white}${this.pid}${colors.reset}  - ` +
      `${timestamp}     ` +
      `${levelColor}${levelPadded}${colors.reset} ` +
      `${colors.yellow}[${context}]${colors.reset} ` +
      `${messageColor}${message}${colors.reset}${elapsed}`
  }

  log(context: string, message: string, showTime: boolean = true): void {
    if (!this.enabled) return
    console.log(this.formatMessage('LOG', context, message, showTime))
  }

  warn(context: string, message: string, showTime: boolean = true): void {
    if (!this.enabled) return
    console.warn(this.formatMessage('WARN', context, message, showTime))
  }

  error(context: string, message: string, showTime: boolean = true): void {
    if (!this.enabled) return
    console.error(this.formatMessage('ERROR', context, message, showTime))
  }

  debug(context: string, message: string, showTime: boolean = true): void {
    if (!this.enabled) return
    console.debug(this.formatMessage('DEBUG', context, message, showTime))
  }

  /**
   * Reset the elapsed time counter
   */
  resetTimer(): void {
    this.lastLogTime = Date.now()
  }
}

export const internalLogger = InternalLogger.getInstance()


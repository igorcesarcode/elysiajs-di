/**
 * Application Logger - NestJS-style logger for use in services and controllers
 * 
 * @example
 * ```typescript
 * @singleton()
 * class UserService {
 *   private readonly logger = new ApplicationLogger(UserService.name)
 *   
 *   findAll() {
 *     this.logger.log('Fetching all users')
 *     return []
 *   }
 * }
 * ```
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
  blue: '\x1b[34m',
}

type LogLevel = 'LOG' | 'WARN' | 'ERROR' | 'DEBUG' | 'VERBOSE'

export class ApplicationLogger {
  private static appName: string = 'Elysia'
  private static enabled: boolean = true
  private readonly context: string
  private readonly pid: number = process.pid

  constructor(context?: string) {
    this.context = context || 'Application'
  }

  /**
   * Set the application name globally
   */
  static setAppName(name: string): void {
    ApplicationLogger.appName = name
  }

  /**
   * Enable or disable logging globally
   */
  static setEnabled(enabled: boolean): void {
    ApplicationLogger.enabled = enabled
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

  private formatMessage(level: LogLevel, message: string, optionalParams: any[]): string {
    const timestamp = this.getTimestamp()
    const levelColor = this.getLevelColor(level)
    const levelPadded = level.padEnd(5)
    
    let formattedMessage = message
    if (optionalParams.length > 0) {
      formattedMessage += ' ' + optionalParams.map(p => 
        typeof p === 'object' ? JSON.stringify(p) : String(p)
      ).join(' ')
    }
    
    // Use level color for message on ERROR and WARN
    const messageColor = level === 'ERROR' || level === 'WARN' ? levelColor : colors.green
    
    return `${colors.green}[${ApplicationLogger.appName}]${colors.reset} ` +
           `${colors.white}${this.pid}${colors.reset}  - ` +
           `${timestamp}     ` +
           `${levelColor}${levelPadded}${colors.reset} ` +
           `${colors.yellow}[${this.context}]${colors.reset} ` +
           `${messageColor}${formattedMessage}${colors.reset}`
  }

  /**
   * Log a message (INFO level)
   */
  log(message: string, ...optionalParams: any[]): void {
    if (!ApplicationLogger.enabled) return
    console.log(this.formatMessage('LOG', message, optionalParams))
  }

  /**
   * Log an error message
   */
  error(message: string, ...optionalParams: any[]): void {
    if (!ApplicationLogger.enabled) return
    console.error(this.formatMessage('ERROR', message, optionalParams))
  }

  /**
   * Log a warning message
   */
  warn(message: string, ...optionalParams: any[]): void {
    if (!ApplicationLogger.enabled) return
    console.warn(this.formatMessage('WARN', message, optionalParams))
  }

  /**
   * Log a debug message
   */
  debug(message: string, ...optionalParams: any[]): void {
    if (!ApplicationLogger.enabled) return
    console.debug(this.formatMessage('DEBUG', message, optionalParams))
  }

  /**
   * Log a verbose message
   */
  verbose(message: string, ...optionalParams: any[]): void {
    if (!ApplicationLogger.enabled) return
    console.log(this.formatMessage('VERBOSE', message, optionalParams))
  }
}


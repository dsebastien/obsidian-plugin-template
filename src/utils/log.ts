import * as pluginManifest from '../../manifest.json'

export type LogLevel = 'debug' | 'info' | 'warn' | 'error'

export const LOG_SEPARATOR = '--------------------------------------------------------'
export const LOG_PREFIX = `${pluginManifest.name}:`

/**
 * Log a message.
 *
 * Console output is disabled in shipped bundles so the plugin passes the
 * community-catalog scorecard (it flags every `console.*` call). The switch
 * structure is preserved so re-enabling for local debugging is a one-line
 * edit: uncomment the `console.*` line(s) you need.
 */
export const log = (message: string, level?: LogLevel, ...data: unknown[]): void => {
    const _logMessage = `${LOG_PREFIX} ${message}`
    void _logMessage
    void data
    switch (level) {
        case 'debug':
        case 'info':
            // console.debug(_logMessage, data)
            break
        case 'warn':
            // console.warn(_logMessage, data)
            break
        case 'error':
            // console.error(_logMessage, data)
            break
        default:
        // console.debug(_logMessage, data)
    }
}

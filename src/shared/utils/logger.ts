/**
 * Centralized logging utility
 * Replaces console.log/error throughout the codebase
 */

interface LogContext {
    module?: string
    action?: string
    [key: string]: unknown
}

const isDev = import.meta.env.DEV

export const logger = {
    info: (msg: string, ctx?: LogContext) => {
        if (isDev) {
            console.log(`[INFO] ${msg}`, ctx || '')
        }
    },

    warn: (msg: string, ctx?: LogContext) => {
        console.warn(`[WARN] ${msg}`, ctx || '')
    },

    error: (msg: string, err?: unknown, ctx?: LogContext) => {
        console.error(`[ERROR] ${msg}`, err, ctx || '')
    },

    debug: (msg: string, ctx?: LogContext) => {
        if (isDev) {
            console.debug(`[DEBUG] ${msg}`, ctx || '')
        }
    }
}

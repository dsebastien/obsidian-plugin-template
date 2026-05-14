import { describe, it, expect, beforeEach, afterEach, spyOn } from 'bun:test'
import { log } from './log'

describe('log', () => {
    let debugSpy: ReturnType<typeof spyOn>
    let infoSpy: ReturnType<typeof spyOn>
    let warnSpy: ReturnType<typeof spyOn>
    let errorSpy: ReturnType<typeof spyOn>
    let logSpy: ReturnType<typeof spyOn>

    beforeEach(() => {
        debugSpy = spyOn(console, 'debug').mockImplementation(() => {})
        infoSpy = spyOn(console, 'info').mockImplementation(() => {})
        warnSpy = spyOn(console, 'warn').mockImplementation(() => {})
        errorSpy = spyOn(console, 'error').mockImplementation(() => {})
        logSpy = spyOn(console, 'log').mockImplementation(() => {})
    })

    afterEach(() => {
        debugSpy.mockRestore()
        infoSpy.mockRestore()
        warnSpy.mockRestore()
        errorSpy.mockRestore()
        logSpy.mockRestore()
    })

    it('does not produce console output at any level (catalog scorecard)', () => {
        log('test message')
        log('debug msg', 'debug')
        log('info msg', 'info')
        log('warn msg', 'warn')
        log('error msg', 'error')
        log('with data', 'error', { foo: 1 }, 'extra')

        expect(debugSpy).not.toHaveBeenCalled()
        expect(infoSpy).not.toHaveBeenCalled()
        expect(warnSpy).not.toHaveBeenCalled()
        expect(errorSpy).not.toHaveBeenCalled()
        expect(logSpy).not.toHaveBeenCalled()
    })

    it('does not throw at any level', () => {
        expect(() => log('x')).not.toThrow()
        expect(() => log('x', 'debug')).not.toThrow()
        expect(() => log('x', 'info')).not.toThrow()
        expect(() => log('x', 'warn')).not.toThrow()
        expect(() => log('x', 'error')).not.toThrow()
    })
})

import { describe, expect, test } from 'bun:test'
import { produce } from 'immer'
import type { App, PluginManifest } from 'obsidian'
import { TemplatePlugin } from './plugin'
import { DEFAULT_SETTINGS, createDefaultSettings } from './types/plugin-settings.intf'

describe('default settings', () => {
    test('constructing the plugin never freezes the shared defaults', () => {
        const plugin = new TemplatePlugin({} as App, {} as PluginManifest)
        expect(Object.isFrozen(plugin.settings)).toBe(true)
        expect(Object.isFrozen(DEFAULT_SETTINGS)).toBe(false)
    })

    test('loadSettings with no stored data never freezes the shared defaults', async () => {
        // Skip the constructor: its field initializer is the other test's case.
        const settings = produce(createDefaultSettings(), () => {})
        const plugin = Object.assign(Object.create(TemplatePlugin.prototype) as TemplatePlugin, {
            settings,
            loadData: (): Promise<unknown> => Promise.resolve(null)
        })

        await plugin.loadSettings()

        // Immer deep-freezes what produce returns, including subtrees shared
        // with its base: producing from DEFAULT_SETTINGS froze the constant
        // for the rest of the process.
        expect(plugin.settings).toBe(settings)
        expect(Object.isFrozen(DEFAULT_SETTINGS)).toBe(false)
    })

    test('each default settings object is an independent copy', () => {
        const one = createDefaultSettings()
        one.enabled = true
        expect(createDefaultSettings().enabled).toBe(false)
        expect(DEFAULT_SETTINGS.enabled).toBe(false)
    })
})

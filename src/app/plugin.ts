import { Plugin } from 'obsidian'
import { DEFAULT_SETTINGS } from './types/plugin-settings.intf'
import type { PluginSettings } from './types/plugin-settings.intf'
import { TemplatePluginSettingTab } from './settings/settings-tab'
import { log } from '../utils/log'
import { registerWhatsNewView } from './whats-new'
import { produce } from 'immer'
import type { Draft } from 'immer'

// TODO: Rename this class to match your plugin name (e.g., MyAwesomePlugin)
export class TemplatePlugin extends Plugin {
    /**
     * The plugin settings are immutable
     */
    // `override` required: `Plugin.settings?: unknown` exists in the 1.13+
    // typings this template now targets (minAppVersion 1.13.0).
    override settings: PluginSettings = produce(DEFAULT_SETTINGS, () => DEFAULT_SETTINGS)

    /**
     * Executed as soon as the plugin loads
     */
    override async onload() {
        log('Initializing', 'debug')
        // Must run before anything can call saveData (fresh-install detection)
        registerWhatsNewView(this)
        await this.loadSettings()

        // TODO

        // Add a settings screen for the plugin
        this.addSettingTab(new TemplatePluginSettingTab(this.app, this))
    }

    override onunload() {}

    /**
     * Load the plugin settings
     */
    async loadSettings() {
        log('Loading settings', 'debug')
        let loadedSettings = (await this.loadData()) as PluginSettings

        if (!loadedSettings) {
            log('Using default settings', 'debug')
            loadedSettings = produce(DEFAULT_SETTINGS, () => DEFAULT_SETTINGS)
            return
        }

        let needToSaveSettings = false

        this.settings = produce(this.settings, (draft: Draft<PluginSettings>) => {
            // Strict comparison: loadData can return anything (older versions,
            // hand-edited data.json) — a truthy non-boolean like "false" must
            // not reach a boolean field.
            if (typeof loadedSettings.enabled === 'boolean') {
                draft.enabled = loadedSettings.enabled
            } else {
                log('The loaded settings miss the [enabled] property', 'debug')
                needToSaveSettings = true
            }
        })

        log(`Settings loaded`, 'debug', loadedSettings)

        if (needToSaveSettings) {
            void this.saveSettings()
        }
    }

    /**
     * Apply a mutation to the settings (via immer) and persist the result.
     * The single write path — the declarative settings tab routes every
     * control edit through here so persistence happens in exactly one place.
     */
    /** Serializes settings writes; see updateSettings. */
    private settingsWriteChain: Promise<void> = Promise.resolve()

    updateSettings(mutator: (draft: Draft<PluginSettings>) => void): Promise<void> {
        // Persist-then-commit: swap memory only after saveData() succeeds, so
        // a rejected write rolls the control back to the on-disk truth.
        // Serialized: writes queue and each mutation derives from the
        // previous COMMITTED state — without this, overlapping calls produce
        // from the same base across the save await and the second commit
        // silently drops the first edit.
        const run = async (): Promise<void> => {
            const next = produce(this.settings, mutator)
            await this.saveData(next)
            this.settings = next
        }
        const p = this.settingsWriteChain.then(run, run)
        this.settingsWriteChain = p.catch(() => {})
        return p
    }

    /**
     * Save the plugin settings
     */
    async saveSettings() {
        log('Saving settings', 'debug', this.settings)
        await this.saveData(this.settings)
        log('Settings saved', 'debug', this.settings)
    }
}

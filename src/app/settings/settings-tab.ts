import { Notice, PluginSettingTab } from 'obsidian'
import type { App, SettingDefinitionItem } from 'obsidian'
import type TemplatePlugin from '../../main'
import { BUY_ME_A_COFFEE_BADGE_DATA_URL } from '../assets/buy-me-a-coffee'
import { BUY_ME_A_COFFEE_URL, renderSupportSection } from '../ui/support-links'

/**
 * Settings tab, declared rather than rendered (Obsidian 1.13+).
 *
 * `getSettingDefinitions()` REPLACES `display()`: when it returns a non-empty
 * array, `display()` is never called. There is no partial adoption — the whole
 * settings UI is declarative, or none of it. In exchange, Obsidian owns
 * navigation, focus and ARIA, and every declared `name`/`desc` is indexed by
 * the settings search.
 *
 * Rules that each cost a shipped bug the first time they were broken
 * (see AGENTS.md "Declarative settings" for the full list):
 *
 * - A `render:` hook renders the ROW. Write into `setting.settingEl` only;
 *   anything written outside it (e.g. `group.listEl`) is the framework's to
 *   discard, and the control simply does not appear.
 * - `defaultValue` is the fallback for a RESOLVER returning undefined/null,
 *   NOT for a cleared input. Do not declare it on numeric controls; let a
 *   `validate` bounds-check refuse the cleared value inline.
 * - A row `action:` fires on the whole row, not on a button. Destructive
 *   actions need their own confirmation modal.
 * - `setControlValue` MUST reject on failure. Resolving tells the framework
 *   the write landed, so the pane keeps showing a value that was never stored.
 */
// TODO: Rename this class to match your plugin name (e.g., MyAwesomePluginSettingTab)
export class TemplatePluginSettingTab extends PluginSettingTab {
    plugin: TemplatePlugin

    constructor(app: App, plugin: TemplatePlugin) {
        super(app, plugin)
        this.plugin = plugin
    }

    override getSettingDefinitions(): SettingDefinitionItem[] {
        return [
            // TODO: Replace this example control with your plugin's settings.
            // `key` is the name handed to getControlValue/setControlValue.
            {
                name: 'Enabled',
                desc: 'Turn the plugin features on or off.',
                control: { type: 'toggle', key: 'enabled' }
            },
            // TODO: Adapt this or remove
            {
                name: 'Follow me on X',
                desc: 'Sébastien Dubois (@dSebastien)',
                searchable: false,
                // A CTA button, not a row `action:`. `action:` makes the WHOLE
                // row clickable and draws no button at all, so a link row that
                // used to have one silently loses it in the port.
                render: (setting): void => {
                    setting.addButton((button) => {
                        button
                            .setCta()
                            .setButtonText('Follow me on X')
                            .onClick(() => {
                                window.open('https://x.com/dSebastien')
                            })
                    })
                }
            },
            // TODO: Adapt this or remove
            {
                type: 'group',
                // No heading: renderSupportSection draws its own.
                items: [
                    {
                        name: 'Support',
                        // Not a setting — keep it out of the settings search.
                        searchable: false,
                        render: (setting): void => {
                            // Render INSIDE the row (settingEl), never into
                            // group.listEl — see the class docs above.
                            setting.infoEl.remove() // the section draws its own headings
                            // `.setting-item` is a flex ROW. The support block
                            // is a stack of full-width rows, so without this it
                            // would lay its heading, buttons and badge out side
                            // by side.
                            setting.settingEl.addClass('settings-stack')
                            renderSupportSection(setting.settingEl, (el) => {
                                this.renderBuyMeACoffeeBadge(el)
                            })
                        }
                    }
                ]
            }
        ]
    }

    /**
     * Reads the value behind a control `key`. Returning undefined/null makes
     * the framework fall back to the control's declared `defaultValue`.
     */
    override getControlValue(key: string): unknown {
        switch (key) {
            case 'enabled':
                return this.plugin.settings.enabled
            default:
                return undefined
        }
    }

    /**
     * Persists a control edit. Rejecting (not resolving) on failure is what
     * lets the framework roll the control back to the stored truth.
     */
    override async setControlValue(key: string, value: unknown): Promise<void> {
        switch (key) {
            case 'enabled':
                if (typeof value !== 'boolean') {
                    throw new Error(`Setting "${key}" expects a boolean.`)
                }
                await this.plugin.updateSettings((draft) => {
                    draft.enabled = value
                })
                return
            default:
                new Notice('Failed to save settings.')
                throw new Error(`Setting "${key}" does not address a known field.`)
        }
    }

    // TODO: Adapt this or remove
    renderBuyMeACoffeeBadge(contentEl: HTMLElement | DocumentFragment, width = 175) {
        const linkEl = contentEl.createEl('a', {
            href: BUY_ME_A_COFFEE_URL
        })
        const imgEl = linkEl.createEl('img')
        imgEl.src = BUY_ME_A_COFFEE_BADGE_DATA_URL
        imgEl.alt = 'Buy me a coffee'
        imgEl.width = width
    }
}

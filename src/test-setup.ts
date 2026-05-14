/**
 * Test setup file that mocks the 'obsidian' module.
 * The obsidian package is types-only and has no runtime code,
 * so we need to provide mock implementations for tests.
 */
import { mock } from 'bun:test'

// Mock the obsidian module (fire-and-forget, no need to await)
void mock.module('obsidian', () => ({
    Notice: class Notice {
        constructor(_message: string, _timeout?: number) {
            // No-op for tests
        }
    },
    // These are only used as types, but we provide empty implementations
    // in case they're ever accessed at runtime
    App: class App {},
    TFile: class TFile {},
    Plugin: class Plugin {},
    PluginSettingTab: class PluginSettingTab {},
    Setting: class Setting {},
    MarkdownView: class MarkdownView {},
    TAbstractFile: class TAbstractFile {},
    TFolder: class TFolder {},
    AbstractInputSuggest: class AbstractInputSuggest {},
    SearchComponent: class SearchComponent {},
    // Modal primitives — needed for ConfirmModal-style replacements
    // for the forbidden window.confirm(). See AGENTS.md.
    Modal: class Modal {
        contentEl: HTMLElement = {} as HTMLElement
        titleEl: HTMLElement = {} as HTMLElement
        open() {}
        close() {}
        onOpen() {}
        onClose() {}
    },
    FuzzySuggestModal: class FuzzySuggestModal {
        setPlaceholder(_placeholder: string) {}
        getItems(): unknown[] {
            return []
        }
        getItemText(_item: unknown): string {
            return ''
        }
        onChooseItem(_item: unknown) {}
        open() {}
        close() {}
    },
    // UI components commonly reached for in settings tabs
    ButtonComponent: class ButtonComponent {
        setButtonText(_text: string) {
            return this
        }
        setIcon(_icon: string) {
            return this
        }
        setTooltip(_tooltip: string) {
            return this
        }
        setCta() {
            return this
        }
        setWarning() {
            return this
        }
        onClick(_cb: () => unknown) {
            return this
        }
    },
    Menu: class Menu {
        addItem(_cb: (item: unknown) => unknown) {
            return this
        }
        showAtMouseEvent(_e: MouseEvent) {}
        showAtPosition(_p: { x: number; y: number }) {}
    },
    // Network — the obsidian-fetch adapter wraps this
    requestUrl: async (_params: unknown) => ({
        status: 200,
        headers: {},
        text: '',
        json: {},
        arrayBuffer: new ArrayBuffer(0)
    }),
    debounce: (fn: (...args: unknown[]) => unknown) => fn,
    setIcon: () => {}
}))

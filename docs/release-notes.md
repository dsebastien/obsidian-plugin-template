# Release Notes

## 3.0.0 (2026-08-28)

### ⚠ BREAKING CHANGES

- **plugin:** minAppVersion moves 1.8.7 -> 1.13.0.

The settings tab is now declarative: getSettingDefinitions() replaces
display() entirely (a non-empty array means display() is never called —
there is no partial adoption). Obsidian owns navigation, focus and ARIA,
and declared names/descriptions are indexed by the settings search.

The template ships one of each shape as a worked example: a `control`
toggle wired through getControlValue/setControlValue to a new
Plugin.updateSettings() single write path, an `action` row, and a
`render` group that stays inside its own settingEl.

The port rules that each cost a shipped bug in the first fleet plugin to
adopt this API are documented in AGENTS.md ("Declarative settings"), and
the two statically-catchable ones are enforced by a new guard spec:
render hooks writing into group.listEl, and settingEl.remove(). The
guard strips comments first — docs may name the forbidden patterns, code
may not use them — and was verified to catch a planted offender.

Also: obsidian typings 1.12.0 -> 1.13.1 (public), which makes
Plugin.settings a declared base member, so the field now carries
`override`. Bun joins the lint globals (tests run under the Bun
runtime; scripts/ was already lint-ignored).

Acceptance for any future settings change is a live vault check —
nothing in CI renders a settings pane. Flagged per the No UI
self-verification rule: verify the settings pane of a plugin generated
from this template in a real vault.

### Features

- **plugin:** declare settings via getSettingDefinitions (Obsidian 1.13)

### Bug Fixes

- **build:** inline the changelog via a define, and stop shrinking the brand list
- **build:** survive the community catalog reviewer's archive build
- **deps:** drop the ajv override, bump fast-uri past its advisories
- **plugin:** keep the follow button, and stop the support block laying out sideways
- **plugin:** persist settings before committing them to memory
- **plugin:** serialize settings writes — overlapping edits lost data
- **plugin:** strict boolean check when loading the enabled setting

## 2.8.0 (2026-08-21)

### Features

- **plugin:** add Knowii community to the what's new dialog and harden it
- **plugin:** aggregate what's new dialogs across simultaneously updated plugins
- **plugin:** show a what's new dialog once after plugin updates
- **plugin:** show what's new in a tab instead of a modal dialog
- **plugin:** surface support CTAs everywhere users can see them

### Bug Fixes

- **deps:** patch 5 high advisories pinned open by the overrides block
- **plugin:** coordinate the what's new dialog via a shared window flag
- **plugin:** keep template compatible with public Obsidian releases
- **plugin:** raise minAppVersion to 1.8.7 for App.loadLocalStorage

## 2.7.0 (2026-07-17)

### Features

- **build:** rewrite docs/\_config.yml on init, document docs landing page

### Bug Fixes

- **plugin:** add override modifiers required by obsidian 1.13 typings
- **plugin:** drop invalid override on settings property

## 2.6.3 (2026-06-17)

### Bug Fixes

- **deps:** override vulnerable transitive dev dependencies

## 2.6.2 (2026-06-03)

### Bug Fixes

- **all:** added warning and fix for latest Obsidian release search changes

## 2.6.1 (2026-05-14)

## 2.6.0 (2026-05-13)

## 2.4.0 (2026-04-07)

### Features

- **all:** updated
- **all:** updated workflows

## 2.3.0 (2026-02-11)

### Features

- **all:** added docs template
- **all:** added Obsidian skills (including obsidian cli)
- **all:** updated scripts

## 2.2.0 (2026-01-30)

### Features

- **all:** updated scripts

## 2.0.4 (2026-01-04)

### Bug Fixes

- **all:** use console.debug instead of console.log

## 2.0.3 (2025-12-16)

### Bug Fixes

- **all:** adapt the build.ts to be generic

## 2.0.2 (2025-12-12)

### Bug Fixes

- **all:** fix image url

## 2.0.1 (2025-12-12)

### Bug Fixes

- **all:** fied the release workflow to name the tags correctly

## 2.0.0 (2025-12-11)

## 1.6.0 (2024-10-27)

## 1.5.0 (2024-05-14)

## 1.4.0 (2024-05-14)

## 1.3.0 (2024-05-14)

## 1.2.0 (2024-05-14)

## 1.1.0 (2024-05-13)

## 1.0.0 (2024-04-26)

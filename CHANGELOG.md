# Changelog

All notable changes to this project will be documented in this file.

## [3.0.0](https://github.com/your-username/obsidian-my-plugin/compare/2.8.0...3.0.0) (2026-08-28)

### ⚠ BREAKING CHANGES

* **plugin:** minAppVersion moves 1.8.7 -> 1.13.0.

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

* **plugin:** declare settings via getSettingDefinitions (Obsidian 1.13) ([2575a89](https://github.com/your-username/obsidian-my-plugin/commit/2575a89a0787ccf32327083024ac9a5deb66894c))

### Bug Fixes

* **build:** inline the changelog via a define, and stop shrinking the brand list ([3ceff1d](https://github.com/your-username/obsidian-my-plugin/commit/3ceff1d437a4efcdce79b309b659bcca884ed25e))
* **build:** survive the community catalog reviewer's archive build ([7e6cb3c](https://github.com/your-username/obsidian-my-plugin/commit/7e6cb3c2c81d98ef0202140aa05d8780dcf4ade4))
* **deps:** drop the ajv override, bump fast-uri past its advisories ([4261dc6](https://github.com/your-username/obsidian-my-plugin/commit/4261dc68b1d3007446c0fc3279266b70be47ac0e))
* **plugin:** keep the follow button, and stop the support block laying out sideways ([6191733](https://github.com/your-username/obsidian-my-plugin/commit/6191733426de0629e1f1599a8f6a7674a591d312))
* **plugin:** persist settings before committing them to memory ([3d4f911](https://github.com/your-username/obsidian-my-plugin/commit/3d4f91193d64d6a41e80d06aa47a1899c2d2dfc0))
* **plugin:** serialize settings writes — overlapping edits lost data ([5114a7c](https://github.com/your-username/obsidian-my-plugin/commit/5114a7c423eb4f875630ae293f060d12b9418efe))
* **plugin:** strict boolean check when loading the enabled setting ([12363ad](https://github.com/your-username/obsidian-my-plugin/commit/12363ad8c18640c98afd49ae4c5e25f59f660e58))

## [2.8.0](https://github.com/your-username/obsidian-my-plugin/compare/2.7.0...2.8.0) (2026-08-21)

### Features

* **plugin:** add Knowii community to the what's new dialog and harden it ([3d40cbb](https://github.com/your-username/obsidian-my-plugin/commit/3d40cbb09ff9c1892bbdf274d9fc0365167a54a9))
* **plugin:** aggregate what's new dialogs across simultaneously updated plugins ([bf1879c](https://github.com/your-username/obsidian-my-plugin/commit/bf1879c6e159f770106ce67776283353aebbeef7))
* **plugin:** show a what's new dialog once after plugin updates ([a84e722](https://github.com/your-username/obsidian-my-plugin/commit/a84e72200c8533c5f8ca5394bd4492daf73a5026))
* **plugin:** show what's new in a tab instead of a modal dialog ([c9c8a9e](https://github.com/your-username/obsidian-my-plugin/commit/c9c8a9e5fa818c04d9eacd8509fccd46d9ec654f))
* **plugin:** surface support CTAs everywhere users can see them ([741ecd9](https://github.com/your-username/obsidian-my-plugin/commit/741ecd94218b05e496391dd5d05b956482cf4a1e))

### Bug Fixes

* **deps:** patch 5 high advisories pinned open by the overrides block ([8ee9a86](https://github.com/your-username/obsidian-my-plugin/commit/8ee9a86a7a762ffaecada9890c418e80ae3ad36a))
* **plugin:** coordinate the what's new dialog via a shared window flag ([acedee9](https://github.com/your-username/obsidian-my-plugin/commit/acedee9c5444186d0408cac9c65587b7439d7638))
* **plugin:** keep template compatible with public Obsidian releases ([80a4512](https://github.com/your-username/obsidian-my-plugin/commit/80a45128bed163269df6742f2e8cb817f72d8c0e))
* **plugin:** raise minAppVersion to 1.8.7 for App.loadLocalStorage ([27f600f](https://github.com/your-username/obsidian-my-plugin/commit/27f600f41b741470ad1fd56f59a182b9a69cd77d))

## [2.7.0](https://github.com/your-username/obsidian-my-plugin/compare/2.6.3...2.7.0) (2026-07-17)

### Features

* **build:** rewrite docs/_config.yml on init, document docs landing page ([4d0d6f7](https://github.com/your-username/obsidian-my-plugin/commit/4d0d6f70fdbe7e053c6c95c424eaf669ff974669))

### Bug Fixes

* **plugin:** add override modifiers required by obsidian 1.13 typings ([9769d12](https://github.com/your-username/obsidian-my-plugin/commit/9769d12f5296b5fed05a569846ea18939789550c))
* **plugin:** drop invalid override on settings property ([c21217c](https://github.com/your-username/obsidian-my-plugin/commit/c21217cbc94ddeac62993848a4d27170e94f366f))

## [2.6.3](https://github.com/your-username/obsidian-my-plugin/compare/2.6.2...2.6.3) (2026-06-17)

### Bug Fixes

* **deps:** override vulnerable transitive dev dependencies ([105930b](https://github.com/your-username/obsidian-my-plugin/commit/105930b6b0a3770cd587c1cdd475685c07cc7ce8))

## [2.6.2](https://github.com/your-username/obsidian-my-plugin/compare/2.6.1...2.6.2) (2026-06-03)

### Bug Fixes

* **all:** added warning and fix for latest Obsidian release search changes ([5ffca92](https://github.com/your-username/obsidian-my-plugin/commit/5ffca927d6c49e046b428a55ae432189ea18b766))

## [2.6.1](https://github.com/your-username/obsidian-my-plugin/compare/2.6.0...2.6.1) (2026-05-14)

## [2.6.0](https://github.com/your-username/obsidian-my-plugin/compare/2.5.0...2.6.0) (2026-05-13)

## [2.4.0](https://github.com/dsebastien/obsidian-plugin-template/compare/2.3.0...2.4.0) (2026-04-07)

### Features

* **all:** updated ([0c5de0f](https://github.com/dsebastien/obsidian-plugin-template/commit/0c5de0feca2f30f99a9d39e73e8421210a92e486))
* **all:** updated workflows ([2bbb6ca](https://github.com/dsebastien/obsidian-plugin-template/commit/2bbb6ca11fc2b4a1a847eb9f29354ed89daa3cce))

## [2.3.0](https://github.com/dsebastien/obsidian-plugin-template/compare/2.2.0...2.3.0) (2026-02-11)

### Features

* **all:** added docs template ([30b9dbc](https://github.com/dsebastien/obsidian-plugin-template/commit/30b9dbc317b3956e5f0748d5e171426533431fb2))
* **all:** added Obsidian skills (including obsidian cli) ([77c0cf4](https://github.com/dsebastien/obsidian-plugin-template/commit/77c0cf4ba71e6e9c320d948abe0c4a8854c1043c))
* **all:** updated scripts ([7949163](https://github.com/dsebastien/obsidian-plugin-template/commit/7949163757b2b87e05bf3d029f99d2a329c08a5a))

## [2.2.0](https://github.com/dsebastien/obsidian-plugin-template/compare/2.1.0...2.2.0) (2026-01-30)

### Features

* **all:** updated scripts ([4b956ac](https://github.com/dsebastien/obsidian-plugin-template/commit/4b956acbb71e41801fcd40f4e5d8eebb28221fc1))

## [2.0.4](https://github.com/dsebastien/obsidian-plugin-template/compare/2.0.3...2.0.4) (2026-01-04)

### Bug Fixes

* **all:** use console.debug instead of console.log ([09306e4](https://github.com/dsebastien/obsidian-plugin-template/commit/09306e492c81437dff10dfe8b3b5e5734be1382a))
## [2.0.3](https://github.com/dsebastien/obsidian-plugin-template/compare/2.0.2...2.0.3) (2025-12-16)

### Bug Fixes

* **all:** adapt the build.ts to be generic ([d4da8a1](https://github.com/dsebastien/obsidian-plugin-template/commit/d4da8a1d8a839800785a89dda1594ff52f049607))
## [2.0.2](https://github.com/dsebastien/obsidian-plugin-template/compare/2.0.1...2.0.2) (2025-12-12)

### Bug Fixes

* **all:** fix image url ([1a0086b](https://github.com/dsebastien/obsidian-plugin-template/commit/1a0086b1982b8da1f6e3c3135f27dcd9bb2ff787))
## [2.0.1](https://github.com/dsebastien/obsidian-plugin-template/compare/2.0.0...2.0.1) (2025-12-12)

### Bug Fixes

* **all:** fied the release workflow to name the tags correctly ([95aa6ff](https://github.com/dsebastien/obsidian-plugin-template/commit/95aa6ffd40e718d055e24e1f052ed374e171376b))
## [2.0.0](https://github.com/dsebastien/obsidian-plugin-template/compare/1.6.0...2.0.0) (2025-12-11)
## [1.6.0](https://github.com/dsebastien/obsidian-plugin-template/compare/1.5.0...1.6.0) (2024-10-27)
## [1.5.0](https://github.com/dsebastien/obsidian-plugin-template/compare/1.4.0...1.5.0) (2024-05-14)
## [1.4.0](https://github.com/dsebastien/obsidian-plugin-template/compare/1.3.0...1.4.0) (2024-05-14)
## [1.3.0](https://github.com/dsebastien/obsidian-plugin-template/compare/1.2.0...1.3.0) (2024-05-14)
## [1.2.0](https://github.com/dsebastien/obsidian-plugin-template/compare/1.1.0...1.2.0) (2024-05-14)
## [1.1.0](https://github.com/dsebastien/obsidian-plugin-template/compare/1.0.0...1.1.0) (2024-05-13)
## 1.0.0 (2024-04-26)













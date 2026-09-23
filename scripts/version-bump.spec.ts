import { afterEach, beforeEach, describe, expect, test } from 'bun:test'
import { mkdtemp, rm } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import type { ManifestJson, VersionsJson } from './version-bump'

describe('ManifestJson interface', () => {
    test('valid manifest structure', () => {
        const manifest: ManifestJson = {
            id: 'test-plugin',
            name: 'Test Plugin',
            version: '1.0.0',
            minAppVersion: '1.4.0'
        }

        expect(manifest.id).toBe('test-plugin')
        expect(manifest.name).toBe('Test Plugin')
        expect(manifest.version).toBe('1.0.0')
        expect(manifest.minAppVersion).toBe('1.4.0')
    })

    test('manifest allows additional properties', () => {
        const manifest: ManifestJson = {
            id: 'test-plugin',
            name: 'Test Plugin',
            version: '1.0.0',
            minAppVersion: '1.4.0',
            author: 'Test Author',
            description: 'A test plugin'
        }

        expect(manifest.author).toBe('Test Author')
        expect(manifest.description).toBe('A test plugin')
    })
})

describe('VersionsJson interface', () => {
    test('valid versions structure', () => {
        const versions: VersionsJson = {
            '1.0.0': '0.15.0',
            '1.1.0': '1.0.0'
        }

        expect(versions['1.0.0']).toBe('0.15.0')
        expect(versions['1.1.0']).toBe('1.0.0')
    })

    test('versions keys should be semver', () => {
        const versions: VersionsJson = {
            '1.0.0': '0.15.0'
        }

        const key = Object.keys(versions)[0]
        expect(key).toMatch(/^\d+\.\d+\.\d+$/)
    })

    test('versions values should be semver', () => {
        const versions: VersionsJson = {
            '1.0.0': '0.15.0'
        }

        const value = Object.values(versions)[0]
        expect(value).toMatch(/^\d+\.\d+\.\d+$/)
    })
})

describe('version format validation', () => {
    test('valid semver formats', () => {
        const validVersions = ['0.0.1', '1.0.0', '1.2.3', '10.20.30']
        const semverRegex = /^\d+\.\d+\.\d+$/

        for (const version of validVersions) {
            expect(version).toMatch(semverRegex)
        }
    })

    test('invalid semver formats', () => {
        const invalidVersions = ['1.0', '1', 'v1.0.0', '1.0.0-beta', '1.0.0.0']
        const semverRegex = /^\d+\.\d+\.\d+$/

        for (const version of invalidVersions) {
            expect(version).not.toMatch(semverRegex)
        }
    })
})

describe('latestMinAppVersion', () => {
    test('returns the floor of the highest release even when it is not the last key', async () => {
        const { latestMinAppVersion } = await import('./version-bump')
        // Real shape: obsidian-starter-kit-plugin lists 1.0.0, 0.1.0, 1.2.0.
        expect(latestMinAppVersion({ '1.2.0': '1.13.0', '0.1.0': '1.4.0', '1.0.0': '1.8.7' })).toBe(
            '1.13.0'
        )
    })

    test('compares versions numerically, not lexicographically', async () => {
        const { latestMinAppVersion } = await import('./version-bump')
        expect(latestMinAppVersion({ '10.0.0': '1.13.0', '9.0.0': '1.4.0' })).toBe('1.13.0')
    })

    test('ignores keys at or above the release being made', async () => {
        const { latestMinAppVersion } = await import('./version-bump')
        // A template leftover "2.0.1" in a plugin still at 1.0.x.
        expect(latestMinAppVersion({ '1.0.0': '1.13.0', '2.0.1': '1.4.0' }, '1.0.1')).toBe('1.13.0')
    })

    test('ignores keys that are not x.y.z', async () => {
        const { latestMinAppVersion } = await import('./version-bump')
        expect(latestMinAppVersion({ '1.0.1': '1.4.0', '1.0.2-beta': '1.13.0' })).toBe('1.4.0')
    })

    test('returns null for an empty file', async () => {
        const { latestMinAppVersion } = await import('./version-bump')
        expect(latestMinAppVersion({})).toBe(null)
    })
})

describe('nextVersions', () => {
    const history = { '1.0.0': '1.4.0', '2.0.0': '1.8.7' }

    test('a release that needs a newer Obsidian adds one line', async () => {
        const { nextVersions } = await import('./version-bump')
        expect(nextVersions(history, '2.1.0', '1.13.0')).toEqual({ ...history, '2.1.0': '1.13.0' })
    })

    test('an unchanged floor adds nothing', async () => {
        const { nextVersions } = await import('./version-bump')
        expect(nextVersions(history, '2.1.0', '1.8.7')).toBe(null)
    })

    test('a lowered floor adds nothing', async () => {
        const { nextVersions } = await import('./version-bump')
        expect(nextVersions(history, '2.1.0', '1.4.0')).toBe(null)
    })

    test('floors compare numerically: 1.10.0 is newer than 1.8.7', async () => {
        const { nextVersions } = await import('./version-bump')
        expect(nextVersions(history, '2.1.0', '1.10.0')).toEqual({ ...history, '2.1.0': '1.10.0' })
    })

    test('a floor raised back after a recorded lowering adds a line', async () => {
        const { nextVersions } = await import('./version-bump')
        // remarkable-sync's real history: 1.13.0 at 1.6.0, lowered to 1.8.7 at
        // 1.8.0. Going back to 1.13.0 needs a newer Obsidian than the latest
        // release did, even though 1.13.0 already appears in the file.
        const versions = { '0.1.0': '1.4.0', '1.6.0': '1.13.0', '1.8.0': '1.8.7' }
        expect(nextVersions(versions, '1.9.0', '1.13.0')).toEqual({
            ...versions,
            '1.9.0': '1.13.0'
        })
    })

    test('a stale future key does not add a line on every release', async () => {
        const { nextVersions } = await import('./version-bump')
        // obsidian-bookshelf: at 1.0.x with a template leftover "2.0.1".
        const versions = { '1.0.0': '1.13.0', '2.0.1': '1.4.0' }
        expect(nextVersions(versions, '1.0.1', '1.13.0')).toBe(null)
    })

    test('a pre-release key cannot hide a raised floor', async () => {
        const { nextVersions } = await import('./version-bump')
        const versions = { '1.0.0-beta': '1.13.0', '1.0.1': '1.4.0' }
        expect(nextVersions(versions, '1.0.2', '1.8.7')).toEqual({ ...versions, '1.0.2': '1.8.7' })
    })

    test('the first release is recorded', async () => {
        const { nextVersions } = await import('./version-bump')
        expect(nextVersions({}, '1.0.0', '1.4.0')).toEqual({ '1.0.0': '1.4.0' })
    })

    test('refuses a version that is not x.y.z', async () => {
        const { nextVersions } = await import('./version-bump')
        expect(() => nextVersions({}, '1.0.0-beta', '1.4.0')).toThrow()
        expect(() => nextVersions({}, '1.0.0', 'latest')).toThrow()
    })
})

describe('bumpVersion', () => {
    // Runs the real read-decide-write path against files in a temp directory.
    let root: string

    beforeEach(async () => {
        root = await mkdtemp(join(tmpdir(), 'version-bump-spec-'))
    })

    afterEach(async () => {
        await rm(root, { recursive: true, force: true })
    })

    const setUp = async (minAppVersion: string, versions: Record<string, string>) => {
        await Bun.write(
            join(root, 'manifest.json'),
            JSON.stringify({ id: 'x', name: 'X', version: '2.0.0', minAppVersion })
        )
        await Bun.write(join(root, 'versions.json'), JSON.stringify(versions, null, 4) + '\n')
    }

    test('writes the new version and a line for a floor raised back above the latest', async () => {
        const { bumpVersion } = await import('./version-bump')
        // 1.13.0 is already in the file, so a membership check would skip it.
        await setUp('1.13.0', { '1.0.0': '1.13.0', '2.0.0': '1.8.7' })
        await bumpVersion('2.1.0', root)
        const manifest = (await Bun.file(join(root, 'manifest.json')).json()) as { version: string }
        expect(manifest.version).toBe('2.1.0')
        expect(await Bun.file(join(root, 'versions.json')).json()).toEqual({
            '1.0.0': '1.13.0',
            '2.0.0': '1.8.7',
            '2.1.0': '1.13.0'
        })
    })

    test('leaves versions.json byte-identical when the floor is lowered', async () => {
        const { bumpVersion } = await import('./version-bump')
        // 1.4.0 is not in the file, so a membership check would add a line.
        await setUp('1.4.0', { '1.0.0': '1.8.7' })
        const before = await Bun.file(join(root, 'versions.json')).text()
        await bumpVersion('1.1.0', root)
        expect(await Bun.file(join(root, 'versions.json')).text()).toBe(before)
    })
})

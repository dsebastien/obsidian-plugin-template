import { describe, expect, test } from 'bun:test'
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
    test('returns the floor of the highest release, not the last key', async () => {
        const { latestMinAppVersion } = await import('./version-bump')
        expect(latestMinAppVersion({ '1.6.0': '1.13.0', '0.1.0': '1.4.0', '1.8.0': '1.8.7' })).toBe(
            '1.8.7'
        )
    })

    test('compares versions numerically, not lexicographically', async () => {
        const { latestMinAppVersion } = await import('./version-bump')
        expect(latestMinAppVersion({ '9.0.0': '1.4.0', '10.0.0': '1.13.0' })).toBe('1.13.0')
    })

    test('returns null for an empty file', async () => {
        const { latestMinAppVersion } = await import('./version-bump')
        expect(latestMinAppVersion({})).toBe(null)
    })

    test('reads the floor of the highest release, even after a lowering', async () => {
        const { latestMinAppVersion } = await import('./version-bump')
        const versions = { '0.1.0': '1.4.0', '1.3.6': '1.7.2', '1.6.0': '1.13.0', '1.8.0': '1.8.7' }
        expect(latestMinAppVersion(versions)).toBe('1.8.7')
    })
})

describe('nextVersions', () => {
    // bumpVersion writes exactly what this returns, so the decision is tested
    // here rather than through the latestMinAppVersion helper alone.
    const history = { '1.0.0': '1.4.0', '2.0.0': '1.8.7' }

    test('a release that needs a newer Obsidian adds one line', async () => {
        const { nextVersions } = await import('./version-bump')
        expect(nextVersions(history, '2.1.0', '1.13.0')).toEqual({
            ...history,
            '2.1.0': '1.13.0'
        })
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
        expect(nextVersions(history, '2.1.0', '1.10.0')).toEqual({
            ...history,
            '2.1.0': '1.10.0'
        })
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

    test('the first release is recorded', async () => {
        const { nextVersions } = await import('./version-bump')
        expect(nextVersions({}, '1.0.0', '1.4.0')).toEqual({ '1.0.0': '1.4.0' })
    })
})

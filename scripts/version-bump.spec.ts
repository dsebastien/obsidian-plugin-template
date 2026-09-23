import { afterEach, beforeEach, describe, expect, test } from 'bun:test'
import { $ } from 'bun'
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

describe('compareVersions', () => {
    test('compares numerically, not lexicographically', async () => {
        const { compareVersions } = await import('./version-bump')
        expect(compareVersions('1.10.0', '1.8.7')).toBeGreaterThan(0)
        expect(compareVersions('1.8.7', '1.10.0')).toBeLessThan(0)
        expect(compareVersions('1.13.0', '1.13.0')).toBe(0)
    })

    test('refuses anything that is not x.y.z', async () => {
        const { compareVersions } = await import('./version-bump')
        expect(() => compareVersions('1.0.0-beta', '1.0.0')).toThrow()
    })
})

describe('nextVersions', () => {
    const versions = { '0.2.4': '1.10.0' }

    test('a raised floor adds one line: the last release on the old floor', async () => {
        const { nextVersions } = await import('./version-bump')
        // obsidian-bookshelf: 0.6.0 shipped on 1.10.0, 1.0.0 needs 1.13.0.
        // Obsidian 1.10 to 1.12 users must get 0.6.0, not 0.2.4.
        expect(
            nextVersions(versions, { version: '0.6.0', minAppVersion: '1.10.0' }, '1.13.0')
        ).toEqual({
            '0.2.4': '1.10.0',
            '0.6.0': '1.10.0'
        })
    })

    test('floors compare numerically: 1.10.0 is a raise over 1.8.7', async () => {
        const { nextVersions } = await import('./version-bump')
        expect(nextVersions({}, { version: '2.0.0', minAppVersion: '1.8.7' }, '1.10.0')).toEqual({
            '2.0.0': '1.8.7'
        })
    })

    test('an unchanged floor adds nothing', async () => {
        const { nextVersions } = await import('./version-bump')
        expect(
            nextVersions(versions, { version: '0.6.0', minAppVersion: '1.10.0' }, '1.10.0')
        ).toBe(null)
    })

    test('a lowered floor adds nothing', async () => {
        const { nextVersions } = await import('./version-bump')
        expect(nextVersions(versions, { version: '0.6.0', minAppVersion: '1.10.0' }, '1.8.7')).toBe(
            null
        )
    })

    test('the first release adds nothing', async () => {
        const { nextVersions } = await import('./version-bump')
        expect(nextVersions({}, null, '1.13.0')).toBe(null)
    })

    test('a line already present is not written again', async () => {
        const { nextVersions } = await import('./version-bump')
        const listed = { '0.6.0': '1.10.0' }
        expect(nextVersions(listed, { version: '0.6.0', minAppVersion: '1.10.0' }, '1.13.0')).toBe(
            null
        )
    })

    test('refuses a version that is not x.y.z', async () => {
        const { nextVersions } = await import('./version-bump')
        expect(() => nextVersions({}, null, 'latest')).toThrow()
        expect(() =>
            nextVersions({}, { version: '1.0.0-beta', minAppVersion: '1.4.0' }, '1.8.7')
        ).toThrow()
    })
})

describe('bumpVersion', () => {
    // Runs the real read-decide-write path, including the previous release's
    // floor read from its git tag, in a throwaway repository.
    let root: string

    const git = (...args: string[]) =>
        $`git -c user.name=spec -c user.email=spec@example.com -c commit.gpgsign=false -c tag.gpgsign=false -c core.hooksPath=/dev/null ${args}`
            .cwd(root)
            .quiet()

    const writeManifest = (version: string, minAppVersion: string) =>
        Bun.write(
            join(root, 'manifest.json'),
            JSON.stringify({ id: 'x', name: 'X', version, minAppVersion })
        )

    const releaseTagged = async (version: string, minAppVersion: string, tag = version) => {
        await writeManifest(version, minAppVersion)
        await git('add', '-A')
        await git('commit', '-q', '-m', `release ${version}`)
        await git('tag', tag)
    }

    beforeEach(async () => {
        root = await mkdtemp(join(tmpdir(), 'version-bump-spec-'))
        await git('init', '-q')
        await Bun.write(
            join(root, 'versions.json'),
            JSON.stringify({ '0.2.4': '1.10.0' }, null, 4) + '\n'
        )
    })

    afterEach(async () => {
        await rm(root, { recursive: true, force: true })
    })

    test('a raised floor records the last release before it, read from its tag', async () => {
        const { bumpVersion } = await import('./version-bump')
        await releaseTagged('0.6.0', '1.10.0')
        await writeManifest('0.6.0', '1.13.0') // the floor raised during development
        await bumpVersion('1.0.0', root)
        const manifest = (await Bun.file(join(root, 'manifest.json')).json()) as { version: string }
        expect(manifest.version).toBe('1.0.0')
        expect(await Bun.file(join(root, 'versions.json')).json()).toEqual({
            '0.2.4': '1.10.0',
            '0.6.0': '1.10.0'
        })
    })

    test('a v-prefixed tag is found too', async () => {
        const { bumpVersion } = await import('./version-bump')
        await releaseTagged('0.6.0', '1.10.0', 'v0.6.0')
        await writeManifest('0.6.0', '1.13.0')
        await bumpVersion('1.0.0', root)
        expect(await Bun.file(join(root, 'versions.json')).json()).toEqual({
            '0.2.4': '1.10.0',
            '0.6.0': '1.10.0'
        })
    })

    test('an unchanged floor leaves versions.json byte-identical', async () => {
        const { bumpVersion } = await import('./version-bump')
        await releaseTagged('0.6.0', '1.10.0')
        const before = await Bun.file(join(root, 'versions.json')).text()
        await bumpVersion('0.6.1', root)
        expect(await Bun.file(join(root, 'versions.json')).text()).toBe(before)
    })

    test('the first release (no tag yet) leaves versions.json byte-identical', async () => {
        const { bumpVersion } = await import('./version-bump')
        await writeManifest('0.0.0', '1.13.0')
        const before = await Bun.file(join(root, 'versions.json')).text()
        await bumpVersion('0.1.0', root)
        expect(await Bun.file(join(root, 'versions.json')).text()).toBe(before)
    })
})

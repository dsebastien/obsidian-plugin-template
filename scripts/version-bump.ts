/**
 * Updates manifest.json and versions.json with the target version.
 * The target version is read from npm_package_version environment variable.
 * Usage: npm_package_version=1.2.3 bun scripts/version-bump.ts
 */

import { join } from 'node:path'
import { file } from 'bun'

export interface ManifestJson {
    id: string
    name: string
    version: string
    minAppVersion: string
    [key: string]: unknown
}

export interface VersionsJson {
    [version: string]: string
}

export async function readManifest(root = '.'): Promise<ManifestJson> {
    const manifestFile = file(join(root, 'manifest.json'))
    return (await manifestFile.json()) as ManifestJson
}

export async function writeManifest(manifest: ManifestJson, root = '.'): Promise<void> {
    const manifestFile = file(join(root, 'manifest.json'))
    await Bun.write(manifestFile, JSON.stringify(manifest, null, 4) + '\n')
}

export async function readVersions(root = '.'): Promise<VersionsJson> {
    const versionsFile = file(join(root, 'versions.json'))
    return (await versionsFile.json()) as VersionsJson
}

export async function writeVersions(versions: VersionsJson, root = '.'): Promise<void> {
    const versionsFile = file(join(root, 'versions.json'))
    await Bun.write(versionsFile, JSON.stringify(versions, null, 4) + '\n')
}

const RELEASE_VERSION = /^(\d+)\.(\d+)\.(\d+)$/

/** x.y.z as numbers, or null for anything else (pre-releases included). */
function parseVersion(version: string): [number, number, number] | null {
    const match = RELEASE_VERSION.exec(version)
    if (!match) {
        return null
    }
    return [Number(match[1]), Number(match[2]), Number(match[3])]
}

/** Numeric x.y.z comparison; throws on anything that is not x.y.z. */
export function compareVersions(a: string, b: string): number {
    const pa = parseVersion(a)
    const pb = parseVersion(b)
    if (pa === null || pb === null) {
        throw new Error(`Expected x.y.z versions, got "${a}" and "${b}"`)
    }
    for (let i = 0; i < 3; i += 1) {
        const diff = (pa[i] ?? 0) - (pb[i] ?? 0)
        if (diff !== 0) {
            return diff
        }
    }
    return 0
}

/**
 * The minAppVersion of the most recent release recorded in versions.json
 * before targetVersion, or null when there is none.
 *
 * "Most recent" is the highest plugin version by numeric comparison, never
 * the last key: object order is not trustworthy after manual edits. Keys at
 * or above targetVersion are ignored — a leftover such as a template's
 * "2.0.1" in a 1.0.x plugin is not a release this one follows — and so are
 * keys that are not x.y.z, which Obsidian cannot install anyway.
 */
export function latestMinAppVersion(versions: VersionsJson, targetVersion?: string): string | null {
    let latest: string | null = null
    for (const version of Object.keys(versions)) {
        if (parseVersion(version) === null) {
            continue
        }
        if (targetVersion !== undefined && compareVersions(version, targetVersion) >= 0) {
            continue
        }
        if (latest === null || compareVersions(version, latest) > 0) {
            latest = version
        }
    }
    return latest === null ? null : (versions[latest] ?? null)
}

/**
 * versions.json after releasing targetVersion with this minAppVersion, or
 * null when the file must not change.
 *
 * A line is added only when this release needs a NEWER Obsidian than the
 * latest recorded release, so the file stays a short list of compatibility
 * boundaries. Obsidian reads it only when the latest manifest's minAppVersion
 * is above the user's app version, to pick an older release that still runs.
 * An unchanged or lowered floor therefore needs no line: the manifest already
 * covers everyone the release supports.
 */
export function nextVersions(
    versions: VersionsJson,
    targetVersion: string,
    minAppVersion: string
): VersionsJson | null {
    // Both must be x.y.z: Obsidian installs releases by exact tag and
    // compares app versions numerically.
    compareVersions(targetVersion, minAppVersion)
    const latest = latestMinAppVersion(versions, targetVersion)
    if (latest !== null && compareVersions(minAppVersion, latest) <= 0) {
        return null
    }
    return { ...versions, [targetVersion]: minAppVersion }
}

export async function bumpVersion(targetVersion: string, root = '.'): Promise<void> {
    // Read and update manifest.json
    const manifest = await readManifest(root)
    const { minAppVersion } = manifest
    manifest.version = targetVersion
    await writeManifest(manifest, root)
    console.log(`Updated manifest.json version to ${targetVersion}`)

    const versions = nextVersions(await readVersions(root), targetVersion, minAppVersion)
    if (versions !== null) {
        await writeVersions(versions, root)
        console.log(`Added ${targetVersion} -> ${minAppVersion} to versions.json`)
    } else {
        console.log(`versions.json unchanged: ${minAppVersion} needs no newer Obsidian`)
    }
}

// Only run if executed directly
if (import.meta.main) {
    const targetVersion = Bun.env['npm_package_version']

    if (!targetVersion) {
        console.error('Error: npm_package_version environment variable is not set.')
        console.error('Usage: npm_package_version=1.2.3 bun scripts/version-bump.ts')
        process.exit(1)
    }

    await bumpVersion(targetVersion)
}

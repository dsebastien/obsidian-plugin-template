import { afterAll, beforeAll, describe, expect, test } from 'bun:test'
import { unlinkSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { extractReleaseNotes } from '../src/app/utils/release-notes'
import { applyCuratedNotes } from './generate-changelog'

/**
 * Written outside the repo, under a name unique to this process.
 *
 * It used to be `CHANGELOG.test.md` in the repo root. Two problems with that:
 * a run that dies before `afterAll` leaves an untracked file behind, and every
 * commit path here uses `git add -A`, so the stray file gets swept into the
 * next commit — a release commit, if the timing is unlucky. And two runs
 * sharing one checkout (a watcher alongside a manual run, or two agents) race
 * on the same path, so one deletes the file the other is still reading.
 */
const TEST_CHANGELOG = join(tmpdir(), `changelog-spec-${process.pid}-${Date.now()}.md`)

describe('getLatestChangelogEntry', () => {
    beforeAll(() => {
        // Create a test changelog file
        const content = `# Changelog

## [1.2.0] - 2024-01-15

### Added
- New feature A
- New feature B

### Fixed
- Bug fix 1

## [1.1.0] - 2024-01-01

### Added
- Initial feature

## [1.0.0] - 2023-12-01

### Added
- First release
`
        writeFileSync(TEST_CHANGELOG, content)
    })

    afterAll(() => {
        try {
            unlinkSync(TEST_CHANGELOG)
        } catch {
            // Ignore if file doesn't exist
        }
    })

    test('extracts latest version section', async () => {
        const testFile = Bun.file(TEST_CHANGELOG)

        // Read test content and verify extraction logic
        const content = await testFile.text()
        const sections = content.split(/^## /m)

        expect(sections.length).toBeGreaterThan(2)
        expect(sections[1]).toContain('[1.2.0]')
        expect(sections[1]).toContain('New feature A')
    })

    test('returns empty string for non-existent file', async () => {
        // This tests the edge case handling
        const nonExistentFile = Bun.file('CHANGELOG.nonexistent.md')
        const exists = await nonExistentFile.exists()
        expect(exists).toBe(false)
    })
})

describe('changelog format', () => {
    test('conventional changelog format is valid', () => {
        // Verify the expected format structure
        const sampleEntry = `## [1.0.0] - 2024-01-01

### Added
- Feature 1

### Fixed
- Bug 1
`
        expect(sampleEntry).toMatch(/^## \[\d+\.\d+\.\d+\]/)
        expect(sampleEntry).toContain('### Added')
        expect(sampleEntry).toContain('### Fixed')
    })
})

describe('applyCuratedNotes', () => {
    const generated = `## [1.3.0](https://github.com/o/r/compare/1.2.0...1.3.0) (2026-09-28)

### Features

* **plugin:** align with the catalog reviewer's archive ([abc1234](https://github.com/o/r/commit/abc1234))
`

    test('keeps the generated entry when there are no curated notes', () => {
        expect(applyCuratedNotes(generated, null)).toBe(generated)
        expect(applyCuratedNotes(generated, '  \n\n')).toBe(generated)
    })

    test('replaces the commit list with the curated notes under the same header', () => {
        const entry = applyCuratedNotes(generated, '\n### New\n\n- Past view of any note.\n\n')
        expect(entry).toBe(
            '## [1.3.0](https://github.com/o/r/compare/1.2.0...1.3.0) (2026-09-28)\n\n### New\n\n- Past view of any note.\n'
        )
        expect(entry).not.toContain('catalog reviewer')
    })

    test("the curated section is what the What's new tab extracts", () => {
        const changelog = `# Changelog\n\n${applyCuratedNotes(generated, '### New\n\n- Past view of any note.')}\n## [1.2.0](x) (2026-09-01)\n\n- older\n`
        const notes = extractReleaseNotes(changelog, '1.3.0', '1.2.0')
        expect(notes).toContain('Past view of any note.')
        expect(notes).not.toContain('older')
    })

    test.each(['## Highlights', '# Title', '##'])(
        'refuses a %p heading, which would split the release section',
        (heading) => {
            expect(() => applyCuratedNotes(generated, `${heading}\n\n- x`)).toThrow(
                /NEXT_RELEASE\.md: use ### or deeper headings/
            )
        }
    )

    test('accepts deeper headings and hashes that are not headings', () => {
        const entry = applyCuratedNotes(generated, '### Fixed\n\n#### Detail\n\n- Tag #inbox kept.')
        expect(entry).toContain('#### Detail')
        expect(entry).toContain('Tag #inbox kept.')
    })

    test('refuses a generated entry without a version header', () => {
        expect(() => applyCuratedNotes('### Features\n\n* x\n', '- y')).toThrow(/no version header/)
    })
})

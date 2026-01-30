/**
 * Generates or updates CHANGELOG.md using conventional-changelog.
 * Usage: bun scripts/generate-changelog.ts
 */

import { $ } from 'bun'

const CHANGELOG_HEADER = `# Changelog

All notable changes to this project will be documented in this file.

`

export async function generateChangelog(): Promise<string> {
    const changelogFile = Bun.file('CHANGELOG.md')

    // Read existing changelog content (excluding header)
    let existingContent = ''
    if (await changelogFile.exists()) {
        const content = await changelogFile.text()
        // Remove the header if present (everything before first ## version line)
        const match = content.match(/^(## \[?\d)/m)
        if (match?.index !== undefined) {
            existingContent = content.substring(match.index)
        } else if (!content.startsWith('#')) {
            // No header, keep all content
            existingContent = content
        }
    }

    // Generate new changelog entry to stdout
    const newEntry = await $`bunx conventional-changelog -p conventionalcommits -r 1`.text()

    // Combine header + new entry + existing content
    const finalContent =
        CHANGELOG_HEADER +
        newEntry.trim() +
        (existingContent ? '\n\n' + existingContent : '') +
        '\n'

    // Write the combined content
    await Bun.write('CHANGELOG.md', finalContent)

    return newEntry
}

export async function getLatestChangelogEntry(): Promise<string> {
    const changelogFile = Bun.file('CHANGELOG.md')
    if (!(await changelogFile.exists())) {
        return ''
    }

    const content = await changelogFile.text()
    // Extract the latest version section (between first and second ## headers)
    const sections = content.split(/^## /m)
    if (sections.length < 2) {
        return content
    }
    // Return the first version section (sections[0] is content before first ##)
    return '## ' + (sections[1] ?? '')
}

// Only run if executed directly
if (import.meta.main) {
    console.log('Generating changelog...')
    await generateChangelog()
    console.log('Changelog updated successfully.')

    const latestEntry = await getLatestChangelogEntry()
    console.log('\n--- Latest changelog entry ---')
    console.log(latestEntry)
}

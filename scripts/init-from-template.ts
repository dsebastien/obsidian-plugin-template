/**
 * Bootstraps a new plugin from this template.
 *
 * Resets state inherited from the template that would otherwise leak into the
 * new plugin's releases and metadata:
 *   - CHANGELOG.md → fresh header
 *   - versions.json → {}
 *   - manifest.json → id, name, description, version (0.0.0), author fields
 *   - package.json → name, version (0.0.0), description, author, repo URLs
 *
 * Usage: bun run init
 */

const TEMPLATE_SENTINEL_PACKAGE_NAME = 'obsidian-my-plugin'
const KEBAB_RE = /^[a-z][a-z0-9-]*$/

interface Answers {
    pluginId: string
    pluginName: string
    description: string
    githubOwner: string
    repoName: string
    authorName: string
    authorEmail: string
    authorUrl: string
    fundingUrl: string
}

function ask(question: string, fallback?: string): string {
    const suffix = fallback ? ` [${fallback}]` : ''
    const answer = prompt(`${question}${suffix}:`)
    const value = (answer ?? '').trim()
    if (!value && fallback !== undefined) return fallback
    return value
}

function askRequired(
    question: string,
    fallback?: string,
    validate?: (v: string) => string | null
): string {
    while (true) {
        const value = ask(question, fallback)
        if (!value) {
            console.error('  ✗ This field is required.')
            continue
        }
        const error = validate?.(value)
        if (error) {
            console.error(`  ✗ ${error}`)
            continue
        }
        return value
    }
}

function validateKebab(v: string): string | null {
    return KEBAB_RE.test(v)
        ? null
        : 'Must be kebab-case (lowercase letters, digits, hyphens; starting with a letter).'
}

async function readJson<T>(path: string): Promise<T> {
    return (await Bun.file(path).json()) as T
}

async function writeJson(path: string, data: unknown): Promise<void> {
    await Bun.write(path, JSON.stringify(data, null, 4) + '\n')
}

async function assertNotAlreadyInitialized(): Promise<void> {
    const pkg = await readJson<{ name?: string }>('package.json')
    if (pkg.name !== TEMPLATE_SENTINEL_PACKAGE_NAME) {
        console.error(
            `Refusing to run: package.json "name" is "${pkg.name}", not the template sentinel "${TEMPLATE_SENTINEL_PACKAGE_NAME}".`
        )
        console.error(
            'This project appears to already be initialized. Aborting to avoid overwriting your changes.'
        )
        console.error(
            'If you really want to re-run, reset package.json "name" to the sentinel value first.'
        )
        process.exit(1)
    }
}

function collectAnswers(): Answers {
    console.log('')
    console.log('=== Initialize plugin from template ===')
    console.log(
        'Answers are used to reset CHANGELOG.md, versions.json, manifest.json, package.json.'
    )
    console.log('')

    const pluginId = askRequired(
        'Plugin id (kebab-case, e.g. "my-awesome-plugin")',
        undefined,
        validateKebab
    )
    const pluginName = askRequired('Plugin display name (e.g. "My Awesome Plugin")')
    const description = askRequired('Short description')
    const githubOwner = askRequired('GitHub owner (user or org)')
    const repoName = askRequired('GitHub repo name', `obsidian-${pluginId}`)
    const authorName = askRequired('Author name')
    const authorEmail = askRequired('Author email')
    const authorUrl = ask('Author URL', '')
    const fundingUrl = ask('Funding URL (leave blank for none)', '')

    return {
        pluginId,
        pluginName,
        description,
        githubOwner,
        repoName,
        authorName,
        authorEmail,
        authorUrl,
        fundingUrl
    }
}

async function resetChangelog(): Promise<void> {
    const body =
        '# Changelog\n\nAll notable changes to this project will be documented in this file.\n'
    await Bun.write('CHANGELOG.md', body)
    console.log('  ✓ CHANGELOG.md reset')
}

async function resetVersions(): Promise<void> {
    await writeJson('versions.json', {})
    console.log('  ✓ versions.json reset')
}

async function updateManifest(a: Answers): Promise<void> {
    const manifest = await readJson<Record<string, unknown>>('manifest.json')
    manifest.id = a.pluginId
    manifest.name = a.pluginName
    manifest.description = a.description
    manifest.version = '0.0.0'
    manifest.author = a.authorName
    if (a.authorUrl) manifest.authorUrl = a.authorUrl
    else delete manifest.authorUrl
    if (a.fundingUrl) manifest.fundingUrl = a.fundingUrl
    else delete manifest.fundingUrl
    await writeJson('manifest.json', manifest)
    console.log('  ✓ manifest.json updated')
}

async function updatePackageJson(a: Answers): Promise<void> {
    const pkg = await readJson<Record<string, unknown>>('package.json')
    pkg.name = a.pluginId
    pkg.version = '0.0.0'
    pkg.description = a.description
    pkg.author = {
        name: a.authorName,
        email: a.authorEmail,
        ...(a.authorUrl ? { url: a.authorUrl } : {})
    }
    const repoHttps = `https://github.com/${a.githubOwner}/${a.repoName}`
    pkg.repository = { type: 'git', url: `git+${repoHttps}.git` }
    pkg.bugs = { url: `${repoHttps}/issues` }
    pkg.homepage = repoHttps
    await writeJson('package.json', pkg)
    console.log('  ✓ package.json updated')
}

function printNextSteps(a: Answers): void {
    console.log('')
    console.log('=== Done ===')
    console.log('')
    console.log('Manual follow-ups (not handled automatically):')
    console.log(
        `  • Rename Plugin class in src/app/plugin.ts (e.g. TemplatePlugin → ${toPascal(a.pluginId)}Plugin)`
    )
    console.log('  • Rename settings tab class in src/app/settings/settings-tab.ts')
    console.log('  • Update imports/exports in src/main.ts')
    console.log('  • Rewrite README.md for your plugin')
    console.log(
        '  • Replace placeholder content in docs/ (user guide) and documentation/ (technical docs)'
    )
    console.log('  • Review .github/FUNDING.yml and settings-tab social links')
    console.log('  • Delete TEMPLATE_USAGE.md and scripts/init-from-template.ts once done')
    console.log('')
    console.log('See TEMPLATE_USAGE.md for the full checklist.')
}

function toPascal(kebab: string): string {
    return kebab
        .split('-')
        .filter(Boolean)
        .map((p) => p[0]!.toUpperCase() + p.slice(1))
        .join('')
}

if (import.meta.main) {
    await assertNotAlreadyInitialized()
    const answers = collectAnswers()
    console.log('')
    console.log('Applying changes...')
    await resetChangelog()
    await resetVersions()
    await updateManifest(answers)
    await updatePackageJson(answers)
    printNextSteps(answers)
}

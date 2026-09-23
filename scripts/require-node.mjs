// ESLint must run under Node, as the community catalog reviewer's does.
// bunfig.toml sets [run] bun = false, but when no Node is on PATH, bun run
// falls back to Bun for the node shebang. Under Bun, node:module
// isBuiltin('bun:test') is true, so obsidianmd/no-nodejs-modules misreads
// every spec's bun:test import and lint fails with findings the reviewer
// never raises. Say so plainly instead.
if (process.versions.bun) {
    console.error(
        'Lint needs Node on PATH (see .nvmrc); it is running under Bun ' +
            process.versions.bun +
            '. Install Node, e.g. with mise or nvm, and run bun run lint again.'
    )
    process.exit(1)
}

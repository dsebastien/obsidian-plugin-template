# Usage

- Copy this project
- Modify package.json (name, description, scripts, PLUGIN_NAME, etc)
- Modify the plugin name in manifest.json
- Modify the plugin name in .github/workflows/release.yml
- Install the project dependencies using ´npm install`
- Run `npx nx connect` to generate a Nx Cloud access token, then make sure to connect the workspace to your Nx cloud organization

For the first release, don't use `npm version ...`. Simply call `git tag 1.0.0` and push that tag.

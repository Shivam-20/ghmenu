# Repository Guidelines

## Project Structure & Module Organization
`ghmenu` is a small Node.js CLI app. The entrypoint is `index.js`, which parses flags and starts the main screen flow. Core logic lives in `src/`: `src/screens/` contains menu screens (`main.js`, `repos.js`, `auth.js`), `src/ui.js` wraps prompt and display helpers, `src/github.js` manages the authenticated Octokit client, and `src/config.js` handles `gh` CLI and token lookup. Installer logic lives in `scripts/install.sh`.

## Build, Test, and Development Commands
- `npm install` installs runtime dependencies.
- `npm start` runs the CLI locally via `node index.js`.
- `node index.js --debug` starts the app with file logging enabled.
- `npm run install:global` runs `scripts/install.sh` to install a local `ghmenu` command.
- `npm test` currently fails by design because no automated test suite exists yet; add real tests before relying on it in CI.

## Coding Style & Naming Conventions
Use CommonJS modules (`require`, `module.exports`) to match the existing codebase. Follow the current style: 2-space indentation, semicolons, single quotes, and small focused functions. Keep screen files action-oriented (`listRepos`, `checkStatus`) and prefer descriptive filenames under `src/screens/`. Reuse helpers in `src/ui.js` instead of duplicating prompt or formatting logic.

## Testing Guidelines
There is no test framework configured yet. For now, verify changes manually with `npm start` and walk through repository and auth flows. When adding tests, keep them close to the behavior they cover, use names that mirror the module under test (for example, `src/screens/repos.test.js`), and update `npm test` to run them.

## Commit & Pull Request Guidelines
Recent history uses Conventional Commit prefixes such as `feat:`. Continue with concise, imperative subjects like `fix: handle missing gh auth token`. Pull requests should explain the user-visible change, list manual verification steps, and call out any GitHub auth or CLI prerequisites. Include terminal screenshots only when the menu output materially changes.

## Security & Configuration Tips
Do not hardcode tokens. Authentication should continue to prefer `gh auth token` and fall back to `GITHUB_TOKEN`. Debug logs are written under `~/.local/share/ghmenu/logs`, so avoid logging secrets when expanding diagnostics.

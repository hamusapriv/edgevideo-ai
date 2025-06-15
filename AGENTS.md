# AGENT Guidelines for edgevideo-ai

This file outlines how Codex agents and contributors should work in this repository.

## Development Environment
- Use **Node.js v20**. The GitHub workflows expect this version.
- Install dependencies with `npm ci`.
- Local development server: `npm run dev`.
- Build the production bundle with `npm run build`.
- Lint the project with `npm run lint` and resolve any issues before committing.

## Code Style
- Source files reside in the `src/` directory. React components use the `.jsx` extension.
- Indent with **2 spaces** and terminate statements with **semicolons**.
- Prefer **double quotes** for strings to match existing code.
- Keep component names in **PascalCase**.
- Place static assets in `public/` and import them relative to that folder when needed.

## Testing and Checks
- Currently this project has no automated test suite. When tests are added, run `npm test`.
- Always run `npm run lint` and `npm run build` before opening a pull request. Include the results of these commands in the PR description.
- If commands fail due to missing dependencies or environment restrictions, note that in the PR.

## Commit Messages
- Write short, descriptive commit messages in the **imperative** mood (e.g., "Add login page").
- Limit the subject line to **72 characters** or fewer.
- Use additional lines after the first if more detail is needed.

## Pull Requests
- Summaries must mention the main changes and provide file path citations for the key lines modified, using the form `【F:path/to/file†Lstart-Lend】`.
- Cite relevant terminal output for tests or builds using `【chunk_id†L1-Ln】` when applicable.
- Ensure `npm run lint` and `npm run build` are executed and their results included in the PR body.

## Repository Notes
- Deployment is handled by GitHub Actions defined in `.github/workflows/`.
- Keep configuration files at the project root (e.g., `eslint.config.js`, `vite.config.js`) up to date with changes in project tooling.


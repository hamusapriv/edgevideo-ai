# AGENT Guidelines for edgevideo-ai

This file outlines how Codex agents and contributors should work in this repository.

## Development Environment
- Use **Node.js v20 or later**. Node 22 is available in this environment.
- Install dependencies with `npm ci`.
- Local development server: `npm run dev`.
- Build the production bundle with `npm run build`.
- Attempt to lint the project with `npm run lint`. If the command fails due to tooling or environment restrictions, document it in the PR.

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


## Project Structure
- `index.html`: entry point loaded by Vite.
- `src/main.jsx`: initializes React and wraps the app with context providers.
- `src/App.jsx`: defines application routes pointing to files in `src/pages`.
- `src/pages/`: page-level React components (HomePage, DemoPage, TermsPage, etc.).
- `src/components/`: reusable UI components. Subfolders contain button components, social media buttons, and SVG icons used by pages and layouts.
- `src/contexts/`: React context providers for auth, favorites, sidebar state, product data, and AI status. Components import these contexts.
- `src/hooks/`: custom hooks shared across components (e.g., infinite scroll, product AI status).
- `src/legacy/`: older non-React modules used by `src/screen/ScreenInitializer.jsx` to integrate legacy behavior.
- `src/screen/ScreenInitializer.jsx`: starts legacy features such as faces or products modules when requested by React pages.
- `src/data/channels.js`: list of streaming channels displayed by components.
- `src/utils/`: utility functions like image validation and AI status testing.
- `src/styles/`: CSS files grouped by feature or page.
- `public/`: static assets referenced by the application.
- `vite.config.js`: Vite build configuration.
- `eslint.config.js`: ESLint rules for linting.
- `firebase.json`: Firebase hosting configuration.
- `test-preload.html`: standalone page for testing image preloading logic.

Files generally import siblings with the same name. For example, `HomePage.jsx` imports components from `src/components` and styles from `src/styles`. Context providers defined in `src/contexts` are consumed by pages and components to share state.

## Legacy External Scripts
- https://edgevideopublic.s3.amazonaws.com/2nd/main.js
- https://storage.googleapis.com/edge_cloud_storage/screenNoAnim.js?t=1749594368418
These scripts were previously included in the app. Use them as references when migrating features to React and Vite.

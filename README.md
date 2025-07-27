# EdgeVideo AI - React + Vite Application

This is the EdgeVideo AI React application built with Vite, featuring both staging and production build modes for flexible deployment workflows.

## Deployment Workflows

### Automated GitHub Actions Deployment

The project uses GitHub Actions for automated deployment:

#### Staging Deployment (Automatic)

**Trigger:** Push to `main` branch

```bash
git push origin main
```

**Result:** https://staging--edgevideo-ai-8753a.web.app

- ✅ Unminified JavaScript bundles with source maps
- ✅ Automatic deployment via GitHub Actions
- ✅ Uses `npm run build:staging`

#### Pull Request Previews (Automatic)

**Trigger:** Create pull request
**Result:** Temporary preview URL (GitHub will comment the URL)

- ✅ Staging build for testing features
- ✅ Temporary preview channel

#### Production Deployment (Future)

**Trigger:** Push to `production` branch

```bash
git push origin production
```

**Result:** edgevideo.ai (when DNS is switched from Webflow)

- ✅ Minified and optimized bundles
- ✅ Uses `npm run build` for maximum performance

### Manual Deployment (Alternative)

For manual deployments when needed:

```bash
# Staging deployment to preview channel
npm run build:staging && firebase hosting:channel:deploy staging

# Production deployment (future)
npm run build && firebase deploy --only hosting
```

**Result:** edgevideo.ai (when DNS is switched from Webflow)

- ✅ Minified and optimized bundles
- ✅ No source maps (smaller bundle size)
- ✅ Maximum performance optimization

## Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Production build (minified, no source maps)
- `npm run build:staging` - Staging build (unminified, with source maps)
- `npm run preview` - Preview built application locally
- `npm run lint` - Run ESLint

## Build Modes

The Vite configuration automatically detects build modes:

- **Staging Mode** (`--mode staging`): Unminified builds with source maps for easier debugging
- **Production Mode** (default): Minified builds without source maps for optimal performance

## Firebase Hosting Configuration

The `firebase.json` is configured with:

- `predeploy: "npm run build:staging"` - Automatically builds staging version before preview channel deploys
- Single Page Application routing support
- Static asset serving from `dist/` directory

## Template Information

This template provides a minimal setup to get React working in Vite with HMR and some ESLint rules.

Currently, two official plugins are available:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react) uses [Babel](https://babeljs.io/) for Fast Refresh
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react-swc) uses [SWC](https://swc.rs/) for Fast Refresh

## Directory Structure

Only the root `index.html` is used for hosting. The former `edgevideo-ai/` folder has been removed.

Legacy non-React scripts now reside in the top-level `legacy/` directory.
React context providers live in `src/contexts` instead of scattered folders.

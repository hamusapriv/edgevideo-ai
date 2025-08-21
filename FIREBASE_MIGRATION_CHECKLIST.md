# Firebase Custom Domain Migration Checklist

## Completed Changes ✅

### 1. Environment Configuration

- ✅ Updated `.env` to use `https://edgevideo.ai/app/oauth2callback`
- ✅ Created `.env.production` for production-specific variables
- ✅ Created `.env.staging` for staging-specific variables

### 2. SEO & Meta Tags Updates

- ✅ Updated `index.html` canonical URL to `https://edgevideo.ai/app`
- ✅ Updated Open Graph URLs to use `edgevideo.ai` (without www)
- ✅ Updated Twitter Card URLs to use `edgevideo.ai`
- ✅ Updated structured data URLs in `index.html`
- ✅ Updated `SEOHead.jsx` component default URLs
- ✅ Updated all SEO config URLs in `SEOHead.jsx`

### 3. Build Configuration

- ✅ Updated `package.json` scripts to use production mode
- ✅ Updated production workflow to use `npm run build:production`
- ✅ Enhanced Firebase hosting configuration with caching headers

### 4. Domain Assets

- ✅ All image and asset URLs updated to use `edgevideo.ai`

## Required External Actions 🔄

### 1. Google OAuth Configuration

- [ ] Add `https://edgevideo.ai/app/oauth2callback` to Google Cloud Console OAuth settings
- [ ] Verify the redirect URI is working in Google Cloud Console

### 2. Firebase Hosting Setup

- [ ] Verify custom domain `edgevideo.ai` is connected in Firebase Console
- [ ] Ensure SSL certificate is active for the custom domain
- [ ] Test the domain connection: `firebase hosting:channel:open production`

### 3. DNS Verification (Already Done ✅)

- ✅ A record: `edgevideo.ai` → `199.36.158.100`
- ✅ TXT record: `edgevideo.ai` → `hosting-site=edgevideo-production`

### 4. Deployment Steps

1. Push changes to `main` branch
2. Create and push to `production` branch to trigger deployment
3. Verify deployment at `https://edgevideo.ai`

## Testing Checklist 🧪

After deployment, verify:

- [ ] Site loads at `https://edgevideo.ai`
- [ ] OAuth login flow works correctly
- [ ] All assets (images, CSS, JS) load properly
- [ ] SEO meta tags are correct (view page source)
- [ ] Social media previews work (test with Facebook/Twitter debugger)
- [ ] All internal links work correctly
- [ ] Mobile responsiveness is maintained

## Rollback Plan 🔄

If issues occur:

1. Revert to using Firebase default domain in `.env.production`
2. Update OAuth settings back to Firebase domain
3. Deploy rollback version

## Notes 📝

- The staging environment continues to use `https://edgevideo-staging.web.app`
- Production uses custom domain `https://edgevideo.ai`
- All www redirects should be handled by Firebase (automatic)
- Assets are served with proper caching headers for performance

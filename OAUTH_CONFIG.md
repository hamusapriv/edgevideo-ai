# OAuth Configuration for Local Development

## Problem

When testing locally on `http://localhost:5173`, the OAuth flow redirects to production domain instead of localhost.

## Root Cause

The backend's Google OAuth configuration only allows production redirect URIs, not localhost.

## Solutions

### 1. Backend Configuration (Recommended)

Add localhost redirect URIs to your Google OAuth application:

**Google Cloud Console:**

1. Go to Google Cloud Console → APIs & Credentials → OAuth 2.0 Client IDs
2. Find your OAuth client ID: `660421509834-ejemlgtvmt15ppa35p8v1adaltfnupki.apps.googleusercontent.com`
3. Add to "Authorized redirect URIs":
   - `http://localhost:5173/app/oauth2callback`
   - `http://127.0.0.1:5173/app/oauth2callback`
   - `http://localhost:3000/app/oauth2callback` (if using different port)
   - `https://edgevideo-staging.web.app/app/oauth2callback`
   - `https://edgevideo.ai/app/oauth2callback` (for future production)

**Backend FastAPI Configuration:**
Your backend at `https://fastapi.edgevideo.ai/auth_google/google` should accept both:

- Staging: `https://edgevideo-staging.web.app/app/oauth2callback`
- Development: `http://localhost:5173/app/oauth2callback`
- Future Production: `https://edgevideo.ai/app/oauth2callback`

### 2. Environment-Specific Configuration

Create different OAuth endpoints for development vs production.

## Current Status

- ✅ OAuth working on localhost:5173
- ✅ Backend OAuth configuration supports localhost
- ✅ Google OAuth client has localhost redirect URIs

## Testing Instructions

1. Run `npm run dev` on localhost:5173
2. Click "Sign In" - OAuth should redirect properly to localhost
3. Test wallet connection functionality
4. For staging testing, deploy and test on `https://edgevideo-staging.web.app`

# Main.js Analysis & Integration Plan

## Key Functions Identified

### 1. Authentication & User Management

- `GetWalletAddress()` - handles recovery codes and email registration
- `SubmitOrRecoverEmail()` - email registration/recovery flow
- `UpdateName()` - fetches user screen name from backend
- `GetEarnFirstWallet()` - creates temporary wallet for new users
- `DoActivation()` / `Activate()` - SMS-based wallet activation (REMOVE)

### 2. Points & Balance Management

- `UpdatePoints()` - fetches balance from `/get_new_points/{walletAddress}`
- `pointsBalance` global variable - current user points
- Updates UI element with id "points"

### 3. Wallet Connection & Verification

- Uses temporary wallets initially
- Activation flow connects to real wallet via SMS code (REPLACE with signature)
- `localStorage` stores: walletAddress, privateKey, finalAddress, email

### 4. WebSocket Gaming (Keep for /app)

- `ConnectSocket()` - connects to wss://gaimify.edgevideo.com
- `OnSocketMessage()` - handles polls, wagering, checkin rewards
- Daily checkin rewards via "checkin" message type

### 5. Daily Check-in System

- `DisplayCheckinDialog()` - shows checkin success UI
- Handled via WebSocket "checkin" message
- Updates points balance after checkin

## API Endpoints Discovered

### Authentication & User

- `https://eat.edgevideo.com:8080/get/user_details/{walletAddress}` - GET user info
- `https://eat.edgevideo.com:8080/register_email` - POST email registration
- `https://eat.edgevideo.com:8080/recover/{recovery_code}` - GET recovery
- `https://eat.edgevideo.com:8081/createWallet` - POST create temp wallet
- `https://eat.edgevideo.com:8080/get_wallet/{code}` - GET wallet by SMS code (REMOVE)

### Points & Rewards

- `https://referrals.edgevideo.com/get_new_points/{walletAddress}` - GET points balance
- WebSocket messages for checkin rewards

### Gaming & Wagering

- WebSocket connection to `wss://gaimify.edgevideo.com`
- Handles polls, wagering, real-time game state

## Environment Variables Needed

```
VITE_API_BASE_EAT=https://eat.edgevideo.com:8080
VITE_API_BASE_EAT_WALLET=https://eat.edgevideo.com:8081
VITE_API_BASE_REFERRALS=https://referrals.edgevideo.com
VITE_WEBSOCKET_URL=wss://gaimify.edgevideo.com
VITE_OAUTH_PROVIDER=google
VITE_OAUTH_CLIENT_ID=your_client_id
```

## Integration Plan

### Phase 1: OAuth Implementation (Home Page)

1. Replace email/SMS flow with OAuth (Google/Firebase)
2. Store OAuth token instead of temporary wallet
3. Create user profile on first login

### Phase 2: Wallet Connection (Home Page Only)

1. Add "Connect Wallet" button after OAuth
2. Implement signature verification:
   - Fetch nonce from backend
   - Sign message with MetaMask
   - Submit signature for verification
3. Store verified wallet address

### Phase 3: Points System (Both Pages)

1. Create PointsContext for balance management
2. Fetch points using authenticated requests
3. Real-time updates via WebSocket (app page)

### Phase 4: Daily Rewards (App Page)

1. Implement daily checkin UI
2. Handle WebSocket checkin messages
3. Update points after successful checkin

## Files to Create

- `services/authService.js` - OAuth management
- `services/walletService.js` - Wallet connection & verification
- `services/pointsService.js` - Points balance & spending
- `services/rewardsService.js` - Daily checkin logic
- `services/apiClient.js` - Unified API wrapper
- `contexts/AuthContext.jsx` - OAuth state management
- `contexts/WalletContext.jsx` - Wallet connection state
- `contexts/PointsContext.jsx` - Points balance state
- `components/OAuthButton.jsx` - Sign in/out button
- `components/WalletConnectButton.jsx` - Wallet connection
- `components/PointsDisplay.jsx` - Points balance UI
- `components/DailyCheckIn.jsx` - Daily reward claim

## Security Considerations

1. Never store private keys client-side (remove temp wallet system)
2. OAuth tokens in memory with secure refresh
3. Signature verification with nonce to prevent replay
4. Wallet session tokens with expiration
5. HTTPS-only cookie storage for sensitive data

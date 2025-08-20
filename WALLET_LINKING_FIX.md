# Wallet Linking Status Fix

## Problem

When users refresh the page or log out and log back in, the application doesn't check if the user has already linked their account to a wallet. The `/wallet/get_linked` API endpoint exists but was never called when the page is refreshed.

## Root Cause

The `WalletContext` was only checking `localStorage` for wallet verification status, but not synchronizing with the server's actual wallet linking state. This caused a mismatch between what the server knows and what the frontend displays.

## Solution

Modified the `WalletContext` and `AuthContext` to properly check the server-side wallet linking status:

### Changes Made

#### 1. **WalletContext.jsx** - Added Server-Side Status Check

- **New function**: `checkWalletLinkingStatus()` - calls the `/wallet/get_linked` endpoint
- **New useEffect**: Checks server status when user and wallet are both ready
- **New useEffect**: Listens for authentication events to trigger immediate status check
- **New useEffect**: Handles logout events to clear wallet verification state
- **Synchronization**: Keeps localStorage in sync with server state

#### 2. **AuthContext.jsx** - Added Authentication Events

- **Login Event**: Dispatches `auth-user-authenticated` event when user logs in
- **Logout Event**: Dispatches `auth-user-logout` event when user logs out
- These events trigger immediate wallet status checks in other contexts

#### 3. **rainbowKitWalletService.js** - Added Debug Access

- **Testing**: Made service available on `window.rainbowKitWalletService` for debugging

#### 4. **wallet-linking-test.js** - Added Testing Script

- **Test Script**: Browser console script to test the wallet linking status functionality

## How It Works

### Normal Flow (After Fix)

1. **User logs in** → `AuthContext` dispatches `auth-user-authenticated` event
2. **WalletContext listens** → Triggers `checkWalletLinkingStatus()`
3. **API Call** → Calls `/wallet/get_linked` to check server state
4. **State Sync** → Updates local state to match server state
5. **UI Update** → Components show correct verification status

### Page Refresh Flow (After Fix)

1. **Page loads** → `AuthContext` fetches user from stored token
2. **Wallet connects** → RainbowKit restores wallet connection
3. **Status Check** → `WalletContext` checks server for linking status
4. **Sync** → Local state matches server state
5. **UI Update** → User sees correct verification status immediately

## Testing the Fix

### 1. Browser Console Test

Run the test script in your browser console:

```javascript
// Copy the content of wallet-linking-test.js and paste in console
runWalletTests();
```

### 2. Manual Testing Steps

#### Test Case 1: Fresh Login

1. Clear browser data (localStorage, cookies)
2. Go to the app
3. Sign in with Google
4. Connect wallet
5. Verify wallet ownership
6. **Expected**: Wallet shows as verified

#### Test Case 2: Page Refresh

1. After completing Test Case 1
2. Refresh the page (F5)
3. **Expected**: Wallet should still show as verified (without re-verification)

#### Test Case 3: Logout and Login

1. After completing Test Case 1
2. Log out
3. Log back in with the same Google account
4. Connect the same wallet
5. **Expected**: Wallet should automatically show as verified

#### Test Case 4: Different Wallet

1. After completing Test Case 1
2. Connect a different wallet address
3. **Expected**: Should show "Different wallet linked" message

### 3. Debug Information

Check browser console for these log messages:

- ✅ `"Checking wallet linking status from server..."`
- ✅ `"Wallet is linked on server, updating local state"`
- ✅ `"User authenticated, checking wallet linking status..."`

## API Endpoints Used

- **GET** `/wallet/get_linked` - Check if user has a linked wallet
  - Returns: `{ walletAddress: "0x...", blockReason: null }`
  - Used by: `rainbowKitWalletService.getLinkedWallet()`

## Files Modified

1. `src/contexts/WalletContext.jsx` - Main wallet state management
2. `src/contexts/AuthContext.jsx` - Authentication event dispatching
3. `src/services/rainbowKitWalletService.js` - Debug access
4. `wallet-linking-test.js` - Testing utilities (new file)

## Expected Behavior After Fix

✅ **Page refresh preserves wallet verification status**  
✅ **Login/logout cycle preserves wallet verification status**  
✅ **Server state and local state stay synchronized**  
✅ **No unnecessary re-verification required**  
✅ **Proper handling of different wallet scenarios**

## Troubleshooting

If the fix doesn't work:

1. **Check API endpoint**: Ensure `/wallet/get_linked` is implemented on the backend
2. **Check authentication**: Verify JWT token is valid and not expired
3. **Check console logs**: Look for error messages in browser console
4. **Run test script**: Use `wallet-linking-test.js` to debug API calls
5. **Check network tab**: Verify API calls are being made and returning expected data

## Security Notes

- All API calls include proper JWT authentication
- Local state is validated against server state
- No sensitive information is stored in localStorage
- Wallet verification tokens are server-side validated

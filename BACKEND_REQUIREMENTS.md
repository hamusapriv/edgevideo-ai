# Backend API Requirements for Wallet Verification

## Missing Endpoints

The wallet verification feature requires these FastAPI endpoints to be implemented:

### 1. **POST /wallet/nonce**

**Purpose**: Generate a unique nonce for wallet signature verification

**Request:**

```json
{
  "address": "0x1234567890123456789012345678901234567890"
}
```

**Headers:**

```
Authorization: Bearer <jwt_token>
Content-Type: application/json
```

**Response (200):**

```json
{
  "nonce": "random_string_12345",
  "expires_at": "2025-08-12T15:30:00Z"
}
```

**Response (401):**

```json
{
  "detail": "Invalid or expired token"
}
```

---

### 2. **POST /wallet/verify**

**Purpose**: Verify wallet ownership using cryptographic signature

**Request:**

```json
{
  "address": "0x1234567890123456789012345678901234567890",
  "signature": "0xabcdef...",
  "message": "Welcome to EdgeVideo AI!\n\nPlease sign this message...",
  "nonce": "random_string_12345"
}
```

**Headers:**

```
Authorization: Bearer <jwt_token>
Content-Type: application/json
```

**Response (200):**

```json
{
  "verified": true,
  "wallet_token": "wallet_verification_jwt_token",
  "message": "Wallet verified successfully"
}
```

**Response (400):**

```json
{
  "detail": "Invalid signature or expired nonce"
}
```

---

## Implementation Notes

### Security Considerations:

1. **Nonce Expiration**: Nonces should expire after 5-10 minutes
2. **One-time Use**: Each nonce can only be used once
3. **Signature Verification**: Use proper cryptographic verification (eth_account library)
4. **User Association**: Link verified wallet to the authenticated user's account

### Database Schema:

```sql
-- Add to existing user table or create new table
CREATE TABLE wallet_verifications (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id),
    wallet_address VARCHAR(42) NOT NULL,
    verified_at TIMESTAMP DEFAULT NOW(),
    verification_token TEXT,
    created_at TIMESTAMP DEFAULT NOW(),
    UNIQUE(user_id, wallet_address)
);

CREATE TABLE wallet_nonces (
    id SERIAL PRIMARY KEY,
    nonce VARCHAR(64) UNIQUE NOT NULL,
    wallet_address VARCHAR(42) NOT NULL,
    user_id INTEGER REFERENCES users(id),
    expires_at TIMESTAMP NOT NULL,
    used BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT NOW()
);
```

### Example FastAPI Implementation:

```python
from eth_account.messages import encode_defunct
from eth_account import Account
import secrets
from datetime import datetime, timedelta

@app.post("/wallet/nonce")
async def generate_nonce(
    request: WalletNonceRequest,
    current_user: User = Depends(get_current_user)
):
    # Generate cryptographically secure nonce
    nonce = secrets.token_urlsafe(32)
    expires_at = datetime.utcnow() + timedelta(minutes=10)

    # Store nonce in database
    # ... (save nonce, wallet_address, user_id, expires_at)

    return {
        "nonce": nonce,
        "expires_at": expires_at.isoformat()
    }

@app.post("/wallet/verify")
async def verify_wallet(
    request: WalletVerifyRequest,
    current_user: User = Depends(get_current_user)
):
    # 1. Validate nonce exists and not expired
    # 2. Reconstruct the message that was signed
    # 3. Verify signature matches wallet address

    try:
        message = encode_defunct(text=request.message)
        recovered_address = Account.recover_message(
            message,
            signature=request.signature
        )

        if recovered_address.lower() != request.address.lower():
            raise HTTPException(400, "Invalid signature")

        # 4. Mark wallet as verified for this user
        # ... (save verification to database)

        return {
            "verified": True,
            "message": "Wallet verified successfully"
        }

    except Exception as e:
        raise HTTPException(400, f"Verification failed: {str(e)}")
```

## Current Status

- ✅ Frontend wallet connection working
- ✅ MetaMask integration complete
- ⏳ **Backend endpoints needed** (this file)
- ⏳ Database schema for wallet verification
- ⏳ Cryptographic signature verification logic

## Testing After Implementation

Once endpoints are ready:

1. Remove the disabled state from verification button
2. Test full flow: OAuth → Connect Wallet → Verify Ownership
3. Verify wallet-user association persists across sessions

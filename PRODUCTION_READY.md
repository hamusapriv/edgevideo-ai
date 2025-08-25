# Production Deployment Checklist

## Frontend is Ready for CTO's Points API Deployment

### ✅ **Completed Preparations:**

1. **API Endpoints Updated**: All points API calls now use the new format:

   - `GET /points/get` (no email parameter needed)
   - `POST /points/checkin` (no request body needed)
   - Both endpoints use JWT tokens for user identification

2. **Authentication Token Service**: Ready to exchange Google tokens for backend tokens

   - `src/services/authTokenService.js` - handles token exchange
   - `src/services/pointsService.js` - uses backend-compatible tokens

3. **Testing Code Removed**:

   - ❌ Local backend testing server removed
   - ❌ Test files removed (test-real-auth.js, api-test.html, etc.)
   - ❌ Environment variables cleaned up

4. **Production Configuration**:
   - API Base URL: `https://fastapi.edgevideo.ai`
   - Ready for production points API deployment

### 🔧 **What CTO Needs to Deploy:**

1. **Points API Routes** (`/points/get` and `/points/checkin`)
2. **Token Exchange Endpoint** (`/auth/exchange-token`) - see instructions below

### 📋 **Token Exchange Endpoint for CTO:**

```javascript
// Add this route to handle Google → Backend token exchange
router.post("/auth/exchange-token", async (req, res) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({ error: "No token provided" });
    }

    const googleToken = authHeader.split(" ")[1];

    // Decode Google token
    const decoded = jwt.decode(googleToken);
    if (!decoded || (!decoded.email && !decoded.sub)) {
      return res.status(401).json({ error: "Invalid token payload" });
    }

    // Create viewerId from email or sub
    let viewerId;
    if (decoded.email) {
      viewerId = Buffer.from(decoded.email)
        .toString("base64")
        .replace(/[^a-zA-Z0-9]/g, "")
        .substring(0, 16);
    } else if (decoded.sub) {
      viewerId = decoded.sub;
    }

    // Create backend JWT token
    const backendToken = jwt.sign(
      {
        viewerId: viewerId,
        email: decoded.email,
        iat: Math.floor(Date.now() / 1000),
        exp: Math.floor(Date.now() / 1000) + 24 * 60 * 60,
      },
      process.env.JWT_SECRET || "change_me_in_production"
    );

    res.json({
      success: true,
      token: backendToken,
      viewerId: viewerId,
    });
  } catch (error) {
    console.error("Token exchange error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});
```

### 🚀 **Deployment Steps:**

1. CTO deploys the points API routes with JWT authentication
2. CTO adds the token exchange endpoint
3. Frontend automatically adapts to use new backend tokens
4. Daily check-in system will work seamlessly

### 🧪 **Testing After Deployment:**

- Test user authentication and token exchange
- Verify points balance retrieval works
- Confirm daily check-in functionality
- Check that existing users can continue using the app

**Status**: ✅ Frontend is production-ready!

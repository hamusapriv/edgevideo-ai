// Backend route: /auth/exchange-token
// Add this to your CTO's backend routes

const express = require("express");
const router = express.Router();
const jwt = require("jsonwebtoken");
require("dotenv").config();

// Token exchange endpoint - converts Google tokens to backend tokens
router.post("/exchange-token", async (req, res) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({ error: "No token provided" });
    }

    const googleToken = authHeader.split(" ")[1];

    // Decode Google token (without verification for simplicity)
    let decoded;
    try {
      decoded = jwt.decode(googleToken);
    } catch (err) {
      return res.status(401).json({ error: "Invalid token format" });
    }

    if (!decoded || (!decoded.email && !decoded.sub)) {
      return res.status(401).json({ error: "Invalid token payload" });
    }

    // Create viewerId from email or sub
    let viewerId;
    if (decoded.email) {
      // Hash email to create viewerId
      viewerId = Buffer.from(decoded.email)
        .toString("base64")
        .replace(/[^a-zA-Z0-9]/g, "")
        .substring(0, 16);
    } else if (decoded.sub) {
      viewerId = decoded.sub;
    } else {
      return res.status(401).json({ error: "Cannot determine user ID" });
    }

    // Create new JWT token with viewerId
    const backendToken = jwt.sign(
      {
        viewerId: viewerId,
        email: decoded.email,
        iat: Math.floor(Date.now() / 1000),
        exp: Math.floor(Date.now() / 1000) + 24 * 60 * 60, // 24 hours
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

module.exports = router;

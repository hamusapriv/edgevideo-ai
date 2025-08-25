const express = require("express");
const router = express.Router();
const ethers = require("ethers");
const jwt = require("jsonwebtoken");
const { generateNonce, SiweMessage } = require("siwe");
require("dotenv").config();

const authenticateJwt = (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (authHeader) {
    const token = authHeader.split(" ")[1]; // Extract token from "Bearer TOKEN"

    if (!token) {
      // No token part after Bearer
      return res.status(401).json({ message: "Unauthorized: Malformed token" });
    }

    // First try to verify with our backend secret (for new tokens)
    jwt.verify(
      token,
      process.env.JWT_SECRET || "change_me_in_production",
      (err, payload) => {
        if (!err && payload.viewerId) {
          // Token is valid and has viewerId, use it directly
          req.user = { viewerId: payload.viewerId };
          return next();
        }

        // If that failed, try to decode without verification (for testing)
        try {
          const decoded = jwt.decode(token);
          console.log("Decoded token:", decoded);

          if (decoded && (decoded.viewerId || decoded.email)) {
            let viewerId;

            if (decoded.viewerId) {
              // Use existing viewerId (convert to string if needed)
              viewerId = String(decoded.viewerId);
              req.user = { viewerId: viewerId };
              console.log("Using existing viewerId:", viewerId);
              return next();
            } else if (decoded.email) {
              // Create a viewerId from the email for compatibility
              viewerId = Buffer.from(decoded.email)
                .toString("base64")
                .replace(/[^a-zA-Z0-9]/g, "")
                .substring(0, 12);
              req.user = { viewerId: viewerId, email: decoded.email };
              console.log(
                "Created viewerId from email:",
                decoded.email,
                "viewerId:",
                viewerId
              );
              return next();
            }
          }
        } catch (decodeErr) {
          console.error("Token decode error:", decodeErr.message);
        }

        // If both attempts failed, return error
        console.error(
          "JWT Verification Error:",
          err?.message || "Invalid token format"
        );
        if (err?.name === "TokenExpiredError") {
          return res
            .status(401)
            .json({ message: "Unauthorized: Token expired" });
        }
        return res.status(401).json({ message: "Unauthorized: Invalid token" });
      }
    );
  } else {
    // No Authorization header found
    res.status(401).json({ message: "Unauthorized: No token provided" });
  }
};

router.get("/get", authenticateJwt, async (req, res) => {
  const pool = req.pool;
  try {
    const { viewerId } = req.user;

    const result = await pool.query(
      `SELECT viewer_id FROM v2_viewer_details WHERE viewer_id = $1`,
      [viewerId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "User not found" });
    }

    const balanceQuery = {
      text: `SELECT COALESCE(balance, 0) AS points FROM v2_viewer_balances WHERE viewer_id = $1`,
      values: [viewerId],
    };
    const balanceResult = await pool.query(balanceQuery);

    if (balanceResult.rows.length === 0) {
      return res.json({ points: 0 });
    }

    res.json(balanceResult.rows[0]);
  } catch (err) {
    console.error("Error retrieving points:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

router.post("/checkin", authenticateJwt, async (req, res) => {
  const pool = req.pool;
  const client = await pool.connect();
  try {
    await client.query("BEGIN");

    const { viewerId } = req.user;
    const pointsAwarded = 100;

    const viewerQuery = await client.query(
      `SELECT viewer_id FROM v2_viewer_details WHERE viewer_id = $1 AND activated_date IS NOT NULL`,
      [viewerId]
    );

    if (viewerQuery.rows.length === 0) {
      await client.query("ROLLBACK");
      return res.status(400).json({ error: "Account not activated" });
    }

    const checkinQuery = `
      INSERT INTO v2_daily_checkins (viewer_id, points_awarded)
      VALUES ($1, $2)
      ON CONFLICT DO NOTHING
      RETURNING *
    `;
    const insertResult = await client.query(checkinQuery, [
      viewerId,
      pointsAwarded,
    ]);

    if (insertResult.rowCount > 0) {
      await client.query(
        `INSERT INTO v2_viewer_balances(viewer_id, balance) VALUES($1, $2)
         ON CONFLICT (viewer_id) DO UPDATE SET balance = v2_viewer_balances.balance + $2`,
        [viewerId, pointsAwarded]
      );

      await client.query("COMMIT");

      const countResult = await client.query(
        `SELECT COUNT(*) AS days_checked_in, SUM(points_awarded) AS total_points FROM v2_daily_checkins WHERE viewer_id = $1`,
        [viewerId]
      );

      const daysCheckedIn = countResult.rows[0].days_checked_in;
      const totalCheckinPoints = countResult.rows[0].total_points;

      return res.json({
        success: true,
        days: daysCheckedIn,
        value: pointsAwarded,
        total: totalCheckinPoints,
      });
    } else {
      await client.query("ROLLBACK");
      return res.status(400).json({ error: "Already checked in today" });
    }
  } catch (err) {
    await client.query("ROLLBACK");
    console.error("Error processing daily checkin:", err);
    res.status(500).json({ error: "Internal server error" });
  } finally {
    client.release();
  }
});

module.exports = router;

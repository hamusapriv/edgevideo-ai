const express = require("express");
const cors = require("cors");
require("dotenv").config();

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());

// Mock database pool for local testing
const mockPool = {
  query: async (textOrQuery, values) => {
    let text, queryValues;

    // Handle both query(text, values) and query({text, values}) patterns
    if (typeof textOrQuery === "object" && textOrQuery.text) {
      text = textOrQuery.text;
      queryValues = textOrQuery.values || [];
    } else {
      text = textOrQuery;
      queryValues = values || [];
    }

    console.log("Mock DB Query:", text, queryValues);

    // Mock responses based on query type
    if (text.includes("v2_viewer_details")) {
      return { rows: [{ viewer_id: queryValues[0] }] };
    }

    if (text.includes("v2_viewer_balances") && text.includes("COALESCE")) {
      // Handle the specific points balance query
      return { rows: [{ points: 1000 }] };
    }

    if (text.includes("v2_viewer_balances")) {
      return { rows: [{ points: 1000 }] };
    }

    if (text.includes("v2_daily_checkins") && text.includes("INSERT")) {
      return {
        rowCount: 1,
        rows: [{ viewer_id: values[0], points_awarded: values[1] }],
      };
    }

    if (text.includes("COUNT(*)")) {
      return {
        rows: [
          {
            days_checked_in: "5",
            total_points: "500",
          },
        ],
      };
    }

    return { rows: [] };
  },
  connect: async () => ({
    query: mockPool.query,
    release: () => {},
  }),
};

// Add mock pool to request
app.use((req, res, next) => {
  req.pool = mockPool;
  next();
});

// Routes
const pointsRouter = require("./routes/points");
const authRouter = require("./routes/auth");
app.use("/points", pointsRouter);
app.use("/auth", authRouter);

// Health check
app.get("/health", (req, res) => {
  res.json({ status: "ok", message: "EdgeVideo Backend is running locally" });
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 EdgeVideo Backend running on http://localhost:${PORT}`);
  console.log(`📊 Points API available at http://localhost:${PORT}/points`);
});

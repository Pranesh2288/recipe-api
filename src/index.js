const express = require("express");
const { Pool } = require("pg");
const cors = require("cors");
const { query, validationResult } = require("express-validator");

const app = express();
const port = 3000;

app.use(express.static("public"));

// Middleware to parse JSON
app.use(express.json());

// Middleware to serve static files
app.use(express.static("public"));

// CORS configuration: allow only trusted origins
const allowedOrigins = [
  "http://localhost:3000", // adjust as needed
  // Add production or other trusted origins here
];
app.use(
  cors({
    origin: function (origin, callback) {
      // allow requests with no origin (like mobile apps, curl, etc.)
      if (!origin) return callback(null, true);
      if (allowedOrigins.indexOf(origin) === -1) {
        return callback(
          new Error("CORS policy: This origin is not allowed."),
          false
        );
      }
      return callback(null, true);
    },
  })
);

// PostgreSQL pool setup
const pool = new Pool({
  host: process.env.DB_HOST || "localhost",
  port: process.env.DB_PORT || 5432,
  user: process.env.DB_USER || "recipeuser",
  password: process.env.DB_PASSWORD || "recipepass",
  database: process.env.DB_NAME || "recipedb",
});

// Test route
app.get("/", (req, res) => {
  res.send("Hello from Express with PostgreSQL!");
});

// Create a new recipe (pagination)
app.get(
  "/api/recipes",
  [
    query("page").optional().isInt({ min: 1 }).toInt(),
    query("limit").optional().isInt({ min: 1, max: 100 }).toInt(),
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    const page = req.query.page || 1;
    const limit = req.query.limit || 10;
    const offset = (page - 1) * limit;

    try {
      const totalResult = await pool.query("SELECT COUNT(*) FROM recipes");
      const total = parseInt(totalResult.rows[0].count);

      const result = await pool.query(
        "SELECT * FROM recipes ORDER BY rating DESC, id ASC LIMIT $1 OFFSET $2;",
        [limit, offset]
      );

      res.json({
        page,
        limit,
        total,
        data: result.rows,
      });
    } catch (err) {
      console.error("Error fetching paginated recipes:", err);
      res.status(500).json({ error: "Internal Server Error" });
    }
  }
);

// Search route
app.get(
  "/api/recipes/search",
  [
    query("title").optional().isString().trim().escape(),
    query("cuisine").optional().isString().trim().escape(),
    query("calories")
      .optional()
      .matches(/^(<=|>=|=|<|>)\d+$/),
    query("total_time")
      .optional()
      .matches(/^(<=|>=|=|<|>)\d+$/),
    query("rating")
      .optional()
      .matches(/^(<=|>=|=|<|>)\d+(\.\d+)?$/),
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    const { title, cuisine, calories, total_time, rating } = req.query;

    const whereClauses = [];
    const values = [];
    let paramIndex = 1;

    // Title (partial match)
    if (title) {
      whereClauses.push(`title ILIKE $${paramIndex}`);
      values.push(`%${title}%`);
      paramIndex++;
    }

    // Cuisine (exact match)
    if (cuisine) {
      whereClauses.push(`cuisine = $${paramIndex}`);
      values.push(cuisine);
      paramIndex++;
    }

    // Calories (numeric filter from nutrients -> calories)
    if (calories) {
      const match = calories.match(/(<=|>=|=|<|>)(\d+)/);
      if (match) {
        const [, op, num] = match;
        whereClauses.push(
          `CAST(regexp_replace(nutrients->>'calories', '[^0-9]', '', 'g') AS INTEGER) ${op} $${paramIndex}`
        );
        values.push(Number(num));
        paramIndex++;
      }
    }

    // Total time
    if (total_time) {
      const match = total_time.match(/(<=|>=|=|<|>)(\d+)/);
      if (match) {
        const [, op, num] = match;
        whereClauses.push(`total_time ${op} $${paramIndex}`);
        values.push(Number(num));
        paramIndex++;
      }
    }

    // Rating
    if (rating) {
      const match = rating.match(/(<=|>=|=|<|>)(\d+(\.\d+)?)/);
      if (match) {
        const [, op, num] = match;
        whereClauses.push(`rating ${op} $${paramIndex}`);
        values.push(Number(num));
        paramIndex++;
      }
    }

    const whereSQL = whereClauses.length
      ? `WHERE ${whereClauses.join(" AND ")}`
      : "";

    try {
      const result = await pool.query(
        `SELECT * FROM recipes ${whereSQL} ORDER BY id;`,
        values
      );
      res.json({ data: result.rows });
    } catch (err) {
      console.error("Error in search:", err);
      res.status(500).json({ error: "Internal Server Error" });
    }
  }
);

// Error handling middleware (should be after all routes)
app.use((err, req, res, next) => {
  if (err instanceof Error && err.message.startsWith("CORS policy")) {
    return res.status(403).json({ error: err.message });
  }
  // Log error details for server-side debugging
  console.error("API Error:", err);
  // Send generic error message to client
  res.status(500).json({ error: "Internal Server Error" });
});

// Start the server
app.listen(port, () => {
  console.log(`🚀 Server is running on http://localhost:${port}`);
});

const express = require("express");
const { Pool } = require("pg");

const app = express();
const port = 3000;

app.use(express.static("public"));

// Middleware to parse JSON
app.use(express.json());

// Middleware to serve static files
app.use(express.static("public"));

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

// Create a new recipe
app.get("/api/recipes", async (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 10;
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
});

// Search route
app.get("/api/recipes/search", async (req, res) => {
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
});

// Start the server
app.listen(port, () => {
  console.log(`🚀 Server is running on http://localhost:${port}`);
});

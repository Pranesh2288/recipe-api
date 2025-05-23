const fs = require("fs");
const path = require("path");
const { Pool } = require("pg");

const pool = new Pool({
  host: process.env.DB_HOST || "localhost",
  port: process.env.DB_PORT || 5432,
  user: process.env.DB_USER || "recipeuser",
  password: process.env.DB_PASSWORD || "recipepass",
  database: process.env.DB_NAME || "recipedb",
});

const FILE_PATH = path.join(__dirname, "../data/recipes.json");

async function importRecipes() {
  try {
    const data = fs.readFileSync(FILE_PATH, "utf-8");
    const recipes = JSON.parse(data);
    // console.log("recipes:", recipes);
    // console.log("typeof recipes:", typeof recipes);
    // console.log("Array.isArray(recipes):", Array.isArray(recipes));

    for (const recipe of Object.values(recipes)) {
      const {
        cuisine,
        title,
        rating,
        prep_time,
        cook_time,
        total_time,
        description,
        nutrients,
        serves,
      } = recipe;

      // Skip if title is missing (it's NOT NULL in schema)
      if (!title) continue;

      const cleanFloat = (val) =>
        val === "NaN" || isNaN(parseFloat(val)) ? null : parseFloat(val);
      const cleanInt = (val) =>
        val === "NaN" || isNaN(parseInt(val)) ? null : parseInt(val);

      await pool.query(
        `INSERT INTO recipes
         (cuisine, title, rating, prep_time, cook_time, total_time, description, nutrients, serves)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
        [
          cuisine || null,
          title,
          cleanFloat(rating),
          cleanInt(prep_time),
          cleanInt(cook_time),
          cleanInt(total_time),
          description || null,
          nutrients || null,
          serves || null,
        ]
      );
    }

    console.log("✅ Recipes imported successfully.");
    await pool.end();
  } catch (err) {
    console.error("❌ Failed to import recipes:", err);
    await pool.end();
    process.exit(1);
  }
}

importRecipes();

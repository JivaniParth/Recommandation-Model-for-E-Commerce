require("dotenv").config();

// Lightweight Postgres service shim.
// If a real DATABASE_URL is provided, it will try to create a pg Pool.
// Otherwise it exposes a mock pool that throws descriptive errors and
// provides mocked recommendation functions so the API can run without
// a working Postgres during prototyping.

let pool = null;
let usingPg = false;

const DATABASE_URL = process.env.DATABASE_URL || process.env.PG_CONNECTION;

if (DATABASE_URL) {
  try {
    const { Pool } = require("pg");
    pool = new Pool({ connectionString: DATABASE_URL });
    usingPg = true;
    console.log("postgresService: connected to Postgres via DATABASE_URL");
  } catch (err) {
    console.warn(
      "postgresService: failed to load 'pg' or connect — falling back to mock. Install 'pg' and set DATABASE_URL to use real Postgres.",
      err.message
    );
  }
}

// Mock pool that matches minimal interface used by other services in this repo
class MockClient {
  async query() {
    throw new Error(
      "Postgres not configured. Set DATABASE_URL and install 'pg', or connect the services to Oracle. This is a mock client."
    );
  }
  release() {}
}

class MockPool {
  async connect() {
    return new MockClient();
  }
}

if (!pool) pool = new MockPool();

// Mocked recommendation functions (used by routes when Postgres is preferred)
async function getCollaborativeRecommendations(userId, limit = 10) {
  if (usingPg) {
    const client = await pool.connect();
    try {
      // Prefer a materialized view if available (mv_user_product_purchases)
      const primary = `
        SELECT mv2.product_id, COUNT(DISTINCT mv2.user_id) AS score
        FROM mv_user_product_purchases mv1
        JOIN mv_user_product_purchases mv2
          ON mv1.product_id <> mv2.product_id AND mv1.user_id <> mv2.user_id
        WHERE mv1.user_id = $1
          AND mv2.product_id NOT IN (SELECT product_id FROM mv_user_product_purchases WHERE user_id = $1)
        GROUP BY mv2.product_id
        ORDER BY score DESC
        LIMIT $2
      `;

      try {
        const res = await client.query(primary, [userId, limit]);
        return res.rows.map((r) => ({
          product_id: r.product_id,
          score: parseInt(r.score, 10),
        }));
      } catch (err) {
        // If primary fails (materialized view not present), fall back to direct table join
      }

      const fallback = `
        SELECT ui2.product_id, COUNT(DISTINCT ui2.user_id) AS score
        FROM user_interactions ui1
        JOIN user_interactions ui2
          ON ui1.product_id <> ui2.product_id AND ui1.user_id <> ui2.user_id
        WHERE ui1.user_id = $1
          AND ui2.interaction_type = 'purchase'
          AND ui2.product_id NOT IN (
            SELECT product_id FROM user_interactions WHERE user_id = $1 AND interaction_type = 'purchase'
          )
        GROUP BY ui2.product_id
        ORDER BY score DESC
        LIMIT $2
      `;

      const res2 = await client.query(fallback, [userId, limit]);
      return res2.rows.map((r) => ({
        product_id: r.product_id,
        score: parseInt(r.score, 10),
      }));
    } finally {
      client.release();
    }
  }

  // Mocked response: return products 1..limit with descending score
  const rows = [];
  for (let i = 0; i < limit; i++)
    rows.push({ product_id: i + 1, score: limit - i });
  return rows;
}

async function getContentRecommendations(userId, limit = 10) {
  if (usingPg) {
    const client = await pool.connect();
    try {
      // Determine categories the user prefers and recommend other products from those categories
      const sql = `
        WITH user_cats AS (
          SELECT p.category, COUNT(*) AS cnt
          FROM user_interactions ui
          JOIN products p ON p.id = ui.product_id
          WHERE ui.user_id = $1 AND ui.interaction_type = 'purchase'
          GROUP BY p.category
        )
        SELECT p.id AS product_id, uc.cnt AS score
        FROM products p
        JOIN user_cats uc ON p.category = uc.category
        WHERE p.id NOT IN (
          SELECT product_id FROM user_interactions WHERE user_id = $1 AND interaction_type = 'purchase'
        )
        ORDER BY uc.cnt DESC
        LIMIT $2
      `;

      const res = await client.query(sql, [userId, limit]);
      return res.rows.map((r) => ({
        product_id: r.product_id,
        score: parseInt(r.score, 10),
      }));
    } finally {
      client.release();
    }
  }

  // Mocked content-based response
  const rows = [];
  for (let i = 0; i < limit; i++)
    rows.push({ product_id: 100 + i + 1, score: limit - i });
  return rows;
}

module.exports = {
  pool,
  getCollaborativeRecommendations,
  getContentRecommendations,
};

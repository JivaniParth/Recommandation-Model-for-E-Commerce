const { pool } = require("./postgresService");

async function logEvent({
  user_id = null,
  product_id = null,
  model_id = null,
  event_type,
  metadata = {},
}) {
  if (!event_type) throw new Error("event_type is required");
  const client = await pool.connect();
  try {
    const sql = `INSERT INTO recommendation_events (user_id, product_id, model_id, event_type, metadata) VALUES ($1,$2,$3,$4,$5) RETURNING *`;
    const { rows } = await client.query(sql, [
      user_id,
      product_id,
      model_id,
      event_type,
      metadata,
    ]);
    return rows[0];
  } finally {
    client.release();
  }
}

async function getCountsByModel(modelId) {
  const client = await pool.connect();
  try {
    const sql = `SELECT event_type, COUNT(*)::int AS cnt FROM recommendation_events WHERE model_id = $1 GROUP BY event_type`;
    const { rows } = await client.query(sql, [modelId]);
    return rows;
  } finally {
    client.release();
  }
}

module.exports = { logEvent, getCountsByModel };

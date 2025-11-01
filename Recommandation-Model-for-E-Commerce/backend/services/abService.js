const { pool } = require("./postgresService");

/**
 * Assign all existing users to models evenly (round-robin/random split).
 * Inserts into user_model_assignments. If a user already has an assignment, it is skipped.
 * @param {number[]} modelIds - array of model ids to split users across (e.g. [1,2,3])
 */
async function assignAllUsersEvenSplit(modelIds = [1, 2, 3]) {
  if (!Array.isArray(modelIds) || modelIds.length === 0)
    throw new Error("modelIds required");

  const client = await pool.connect();
  try {
    // Fetch all user ids
    const { rows: users } = await client.query("SELECT id FROM users");
    if (!users || users.length === 0) return { assigned: 0, total: 0 };

    let assigned = 0;
    for (let i = 0; i < users.length; i++) {
      const userId = users[i].id;
      const modelId = modelIds[i % modelIds.length];

      // Try insert; skip if already exists
      await client.query(
        `INSERT INTO user_model_assignments (user_id, model_id) VALUES ($1, $2) ON CONFLICT (user_id) DO NOTHING`,
        [userId, modelId]
      );
      assigned++;
    }

    return { assigned, total: users.length };
  } finally {
    client.release();
  }
}

/**
 * Get or assign a model for a single user. If not assigned, it will assign a random model from active models.
 */
async function getOrAssignUserModel(userId) {
  const client = await pool.connect();
  try {
    // Check existing assignment
    const { rows: existing } = await client.query(
      "SELECT rma.model_id, rm.name FROM user_model_assignments rma JOIN recommendation_models rm ON rma.model_id = rm.id WHERE rma.user_id = $1",
      [userId]
    );
    if (existing && existing.length > 0)
      return {
        user_id: userId,
        model_id: existing[0].model_id,
        model_name: existing[0].name,
      };

    // Choose a random active model
    const { rows: models } = await client.query(
      "SELECT id, name FROM recommendation_models WHERE is_active = true"
    );
    if (!models || models.length === 0)
      throw new Error("No active recommendation models found");
    const rand = models[Math.floor(Math.random() * models.length)];

    await client.query(
      "INSERT INTO user_model_assignments (user_id, model_id) VALUES ($1, $2) ON CONFLICT (user_id) DO UPDATE SET model_id = EXCLUDED.model_id, assigned_at = NOW()",
      [userId, rand.id]
    );

    return { user_id: userId, model_id: rand.id, model_name: rand.name };
  } finally {
    client.release();
  }
}

module.exports = { assignAllUsersEvenSplit, getOrAssignUserModel };

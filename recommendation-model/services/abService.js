// backend/services/abService.js

// Mock model data based on the PostgreSQL seeding (ids 1, 2, 3)
const ACTIVE_MODELS = [
  { id: 1, name: "collaborative" },
  { id: 2, name: "content" },
  { id: 3, name: "graph" },
];

// Simple in-memory assignment map for session consistency (not persistent)
const assignmentMap = new Map();

/**
 * Assign all existing users to models evenly (mocked).
 */
async function assignAllUsersEvenSplit(modelIds = [1, 2, 3]) {
  if (!Array.isArray(modelIds) || modelIds.length === 0)
    throw new Error("modelIds required");

  // Simulate assignment for up to 100 mock users
  for (let i = 1; i <= 100; i++) {
    const userId = i;
    if (!assignmentMap.has(userId)) {
      const modelId = modelIds[(i - 1) % modelIds.length];
      assignmentMap.set(userId, modelId);
    }
  }
  return {
    assigned: 100,
    total: 100,
    warning: "Using mock assignment logic due to Postgres removal.",
  };
}

/**
 * Get or assign a model for a single user (in-memory/random mock).
 */
async function getOrAssignUserModel(userId) {
  let modelId = assignmentMap.get(userId);

  if (!modelId) {
    // Randomly select an active model
    const randIndex = Math.floor(Math.random() * ACTIVE_MODELS.length);
    const randModel = ACTIVE_MODELS[randIndex];
    modelId = randModel.id;

    // Store in-memory for session consistency
    assignmentMap.set(userId, modelId);
  }

  const assignedModel =
    ACTIVE_MODELS.find((m) => m.id === modelId) || ACTIVE_MODELS[0];

  return {
    user_id: userId,
    model_id: assignedModel.id,
    model_name: assignedModel.name,
  };
}

module.exports = { assignAllUsersEvenSplit, getOrAssignUserModel };

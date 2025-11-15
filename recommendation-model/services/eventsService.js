// backend/services/eventsService.js

// Remove the import of pool from "./postgresService" as it's no longer necessary.

/**
 * Mock logEvent function: logs the event to the console instead of Postgres.
 * In a real application, this should be updated to call the Oracle backend API (Port 5000).
 */
async function logEvent({
  user_id = null,
  product_id = null,
  model_id = null,
  event_type,
  metadata = {},
}) {
  if (!event_type) throw new Error("event_type is required");

  const event = {
    user_id,
    product_id,
    model_id,
    event_type,
    metadata,
    created_at: new Date().toISOString(),
    id: Math.floor(Math.random() * 1000),
  };

  console.log(
    `[MOCK EVENT LOGGED] Type: ${event_type}, User: ${user_id}, Model: ${model_id}`
  );

  return event;
}

/**
 * Mock getCountsByModel function: returns static/mock counts.
 */
async function getCountsByModel(modelId) {
  console.log(`[MOCK EVENT COUNTS] Returning mock counts for model ${modelId}`);
  return [
    { event_type: "impression", cnt: 100 + modelId * 10 },
    { event_type: "click", cnt: 20 + modelId * 5 },
  ];
}

module.exports = { logEvent, getCountsByModel };

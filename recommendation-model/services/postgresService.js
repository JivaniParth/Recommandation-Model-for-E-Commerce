// backend/services/postgresService.js

/**
 * Mocked PostgreSQL service for recommendation modules.
 * This file replaces the old Postgres connection with mocks
 * following the migration to the Oracle backend.
 */

class MockClient {
  async query(sql, params) {
    throw new Error(
      "Postgres database is no longer in use. Data logging/A/B assignment logic must be updated to use the Oracle backend API (Port 5000)."
    );
  }
  release() {}
}

class MockPool {
  async connect() {
    return new MockClient();
  }
  async end() {
    return Promise.resolve();
  }
}

const pool = new MockPool();

/**
 * Mock implementation for Collaborative Recommendations.
 * Returns deterministic mock products.
 */
async function getCollaborativeRecommendations(userId, limit = 10) {
  // Mocked response: return products 1..limit with descending score
  const rows = [];
  for (let i = 0; i < limit; i++)
    rows.push({ product_id: i + 1, score: limit - i, model: "collab_mock" });
  return rows;
}

/**
 * Mock implementation for Content Recommendations.
 * Returns deterministic mock products.
 */
async function getContentRecommendations(userId, limit = 10) {
  // Mocked content-based response
  const rows = [];
  for (let i = 0; i < limit; i++)
    rows.push({
      product_id: 100 + i + 1,
      score: limit - i,
      model: "content_mock",
    });
  return rows;
}

module.exports = {
  pool,
  getCollaborativeRecommendations,
  getContentRecommendations,
};

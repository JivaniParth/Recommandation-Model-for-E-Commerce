require("dotenv").config();
const neo4j = require("neo4j-driver");

// Initialize Neo4j driver
let driver = null;
let usingNeo4j = false;

const NEO4J_URI = process.env.NEO4J_URI;
const NEO4J_USER = process.env.NEO4J_USER || "neo4j";
const NEO4J_PASSWORD = process.env.NEO4J_PASSWORD || "password";

if (NEO4J_URI) {
  try {
    driver = neo4j.driver(
      NEO4J_URI,
      neo4j.auth.basic(NEO4J_USER, NEO4J_PASSWORD)
    );
    usingNeo4j = true;
    console.log("neo4jService: driver initialized successfully");
  } catch (err) {
    console.warn(
      "neo4jService: failed to initialize driver, using mock",
      err.message
    );
  }
} else {
  console.warn("neo4jService: NEO4J_URI not set, using mock recommendations");
}

/**
 * Get graph-based recommendations using collaborative filtering
 * Strategy: Find products purchased by users who bought similar items
 */
async function getGraphRecommendations(userId, limit = 10) {
  if (!usingNeo4j || !driver) {
    console.log("Using mock graph recommendations");
    return getMockRecommendations(userId, limit);
  }

  const session = driver.session();

  try {
    // Primary query: Collaborative filtering through purchase relationships
    const cypher = `
      // Find users who purchased the same products as the target user
      MATCH (u:User {id: $userId})-[:PURCHASED]->(p1:Product)<-[:PURCHASED]-(other:User)
      // Find products that these similar users also purchased
      MATCH (other)-[:PURCHASED]->(p2:Product)
      // Exclude products the user already purchased
      WHERE NOT (u)-[:PURCHASED]->(p2) 
        AND u <> other
        AND p2.id IS NOT NULL
      // Return recommendations with collaborative filtering score
      RETURN DISTINCT 
        p2.id AS product_id,
        p2.name AS product_name,
        p2.category AS category,
        p2.price AS price,
        count(DISTINCT other) AS score
      ORDER BY score DESC, p2.id
      LIMIT $limit
    `;

    const result = await session.run(cypher, {
      userId: neo4j.int(userId),
      limit: neo4j.int(limit),
    });

    if (result.records.length === 0) {
      console.log(
        `No collaborative recommendations found for user ${userId}, trying fallback...`
      );
      return await getFallbackRecommendations(session, userId, limit);
    }

    const recommendations = result.records.map((record) => ({
      product_id: record.get("product_id").toNumber
        ? record.get("product_id").toNumber()
        : record.get("product_id"),
      product_name: record.get("product_name"),
      category: record.get("category"),
      price: record.get("price"),
      score: record.get("score").toNumber
        ? record.get("score").toNumber()
        : record.get("score"),
    }));

    console.log(
      `Found ${recommendations.length} graph recommendations for user ${userId}`
    );
    return recommendations;
  } catch (error) {
    console.error("Error in getGraphRecommendations:", error.message);
    // Fallback to mock on error
    return getMockRecommendations(userId, limit);
  } finally {
    await session.close();
  }
}

/**
 * Fallback recommendations when user has no purchase history
 * Strategy 1: Products from viewed/cart items
 * Strategy 2: Popular products overall
 * Strategy 3: Category-based recommendations
 */
async function getFallbackRecommendations(session, userId, limit) {
  try {
    // Try recommendations based on views/cart
    const viewBasedCypher = `
      MATCH (u:User {id: $userId})-[r:VIEWED|ADDED_TO_CART]->(p1:Product)
      MATCH (p1)<-[:PURCHASED]-(other:User)-[:PURCHASED]->(p2:Product)
      WHERE NOT (u)-[:PURCHASED]->(p2)
        AND NOT (u)-[:VIEWED]->(p2)
        AND p2.id IS NOT NULL
      RETURN DISTINCT 
        p2.id AS product_id,
        p2.name AS product_name,
        p2.category AS category,
        p2.price AS price,
        count(DISTINCT other) AS score
      ORDER BY score DESC
      LIMIT $limit
    `;

    const viewResult = await session.run(viewBasedCypher, {
      userId: neo4j.int(userId),
      limit: neo4j.int(limit),
    });

    if (viewResult.records.length > 0) {
      console.log(`Using view-based fallback for user ${userId}`);
      return viewResult.records.map((record) => ({
        product_id: record.get("product_id").toNumber
          ? record.get("product_id").toNumber()
          : record.get("product_id"),
        product_name: record.get("product_name"),
        category: record.get("category"),
        price: record.get("price"),
        score: record.get("score").toNumber
          ? record.get("score").toNumber()
          : record.get("score"),
      }));
    }

    // If no views, return popular products
    const popularCypher = `
      MATCH (p:Product)<-[r:PURCHASED]-(u:User)
      WHERE p.id IS NOT NULL
      RETURN 
        p.id AS product_id,
        p.name AS product_name,
        p.category AS category,
        p.price AS price,
        count(r) AS score
      ORDER BY score DESC
      LIMIT $limit
    `;

    const popularResult = await session.run(popularCypher, {
      limit: neo4j.int(limit),
    });

    if (popularResult.records.length > 0) {
      console.log(`Using popular products fallback for user ${userId}`);
      return popularResult.records.map((record) => ({
        product_id: record.get("product_id").toNumber
          ? record.get("product_id").toNumber()
          : record.get("product_id"),
        product_name: record.get("product_name"),
        category: record.get("category"),
        price: record.get("price"),
        score: record.get("score").toNumber
          ? record.get("score").toNumber()
          : record.get("score"),
      }));
    }

    // Last resort: return any products
    console.log(`Using random products fallback for user ${userId}`);
    const anyCypher = `
      MATCH (p:Product)
      WHERE p.id IS NOT NULL
      RETURN 
        p.id AS product_id,
        p.name AS product_name,
        p.category AS category,
        p.price AS price,
        1 AS score
      LIMIT $limit
    `;

    const anyResult = await session.run(anyCypher, {
      limit: neo4j.int(limit),
    });

    return anyResult.records.map((record) => ({
      product_id: record.get("product_id").toNumber
        ? record.get("product_id").toNumber()
        : record.get("product_id"),
      product_name: record.get("product_name"),
      category: record.get("category"),
      price: record.get("price"),
      score: 1,
    }));
  } catch (error) {
    console.error("Error in fallback recommendations:", error.message);
    return getMockRecommendations(userId, limit);
  }
}

/**
 * Mock recommendations for development/testing without Neo4j
 */
function getMockRecommendations(userId, limit) {
  console.log(`Returning mock recommendations for user ${userId}`);
  const start = (userId % 50) * 3;
  const recommendations = [];

  for (let i = 0; i < limit; i++) {
    recommendations.push({
      product_id: start + i + 1,
      product_name: `Mock Product ${start + i + 1}`,
      category: "Mock Category",
      price: 9.99 + i,
      score: limit - i,
    });
  }

  return recommendations;
}

/**
 * Get category-based recommendations (content filtering via graph)
 */
async function getCategoryRecommendations(userId, limit = 10) {
  if (!usingNeo4j || !driver) {
    return getMockRecommendations(userId, limit);
  }

  const session = driver.session();

  try {
    const cypher = `
      // Find categories the user has purchased from
      MATCH (u:User {id: $userId})-[:PURCHASED]->(p1:Product)
      WITH u, collect(DISTINCT p1.category) AS userCategories
      
      // Find other products in those categories
      MATCH (p2:Product)
      WHERE p2.category IN userCategories
        AND NOT (u)-[:PURCHASED]->(p2)
        AND p2.id IS NOT NULL
      
      // Score by category popularity in user's history
      RETURN 
        p2.id AS product_id,
        p2.name AS product_name,
        p2.category AS category,
        p2.price AS price,
        size([c IN userCategories WHERE c = p2.category]) AS score
      ORDER BY score DESC, p2.id
      LIMIT $limit
    `;

    const result = await session.run(cypher, {
      userId: neo4j.int(userId),
      limit: neo4j.int(limit),
    });

    return result.records.map((record) => ({
      product_id: record.get("product_id").toNumber
        ? record.get("product_id").toNumber()
        : record.get("product_id"),
      product_name: record.get("product_name"),
      category: record.get("category"),
      price: record.get("price"),
      score: record.get("score").toNumber
        ? record.get("score").toNumber()
        : record.get("score"),
    }));
  } catch (error) {
    console.error("Error in getCategoryRecommendations:", error.message);
    return getMockRecommendations(userId, limit);
  } finally {
    await session.close();
  }
}

/**
 * Get stats about the graph database
 */
async function getGraphStats() {
  if (!usingNeo4j || !driver) {
    return { error: "Neo4j not configured" };
  }

  const session = driver.session();

  try {
    const stats = {};

    // Count nodes by label
    const nodeCount = await session.run(`
      MATCH (n)
      RETURN labels(n)[0] as label, count(n) as count
    `);
    stats.nodes = {};
    nodeCount.records.forEach((record) => {
      const label = record.get("label");
      const count = record.get("count").toNumber
        ? record.get("count").toNumber()
        : record.get("count");
      stats.nodes[label] = count;
    });

    // Count relationships by type
    const relCount = await session.run(`
      MATCH ()-[r]->()
      RETURN type(r) as type, count(r) as count
    `);
    stats.relationships = {};
    relCount.records.forEach((record) => {
      const type = record.get("type");
      const count = record.get("count").toNumber
        ? record.get("count").toNumber()
        : record.get("count");
      stats.relationships[type] = count;
    });

    return stats;
  } catch (error) {
    console.error("Error getting graph stats:", error.message);
    return { error: error.message };
  } finally {
    await session.close();
  }
}

/**
 * Close the driver (call on application shutdown)
 */
async function close() {
  if (driver) {
    await driver.close();
    console.log("neo4jService: driver closed");
  }
}

module.exports = {
  getGraphRecommendations,
  getCategoryRecommendations,
  getGraphStats,
  close,
};

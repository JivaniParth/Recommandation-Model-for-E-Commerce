/**
 * Test script for Neo4j integration
 * Run with: node scripts/test-neo4j-integration.js
 */
require("dotenv").config();
const neo4jService = require("../services/neo4jService");
const { pool } = require("../services/postgresService");

const colors = {
  reset: "\x1b[0m",
  bright: "\x1b[1m",
  green: "\x1b[32m",
  red: "\x1b[31m",
  yellow: "\x1b[33m",
  blue: "\x1b[34m",
};

function log(message, color = colors.reset) {
  console.log(color + message + colors.reset);
}

function logHeader(message) {
  console.log("\n" + "=".repeat(60));
  log(message, colors.bright + colors.blue);
  console.log("=".repeat(60));
}

function logSuccess(message) {
  log("✅ " + message, colors.green);
}

function logError(message) {
  log("❌ " + message, colors.red);
}

function logWarning(message) {
  log("⚠️  " + message, colors.yellow);
}

async function testPostgresConnection() {
  logHeader("Test 1: PostgreSQL Connection");

  try {
    const client = await pool.connect();
    logSuccess("Connected to PostgreSQL");

    const { rows } = await client.query("SELECT NOW() as time");
    logSuccess(`Database time: ${rows[0].time}`);

    client.release();
    return true;
  } catch (error) {
    logError(`PostgreSQL connection failed: ${error.message}`);
    return false;
  }
}

async function testPostgresData() {
  logHeader("Test 2: PostgreSQL Data");

  try {
    const client = await pool.connect();

    const users = await client.query("SELECT COUNT(*) as count FROM users");
    const products = await client.query(
      "SELECT COUNT(*) as count FROM products"
    );
    const interactions = await client.query(
      "SELECT COUNT(*) as count FROM user_interactions"
    );

    logSuccess(`Users: ${users.rows[0].count}`);
    logSuccess(`Products: ${products.rows[0].count}`);
    logSuccess(`Interactions: ${interactions.rows[0].count}`);

    if (parseInt(users.rows[0].count) === 0) {
      logWarning("No users found! Run migration 004_seed_core.sql");
      return false;
    }

    client.release();
    return true;
  } catch (error) {
    logError(`PostgreSQL data check failed: ${error.message}`);
    return false;
  }
}

async function testNeo4jConnection() {
  logHeader("Test 3: Neo4j Connection & Data");

  try {
    const stats = await neo4jService.getGraphStats();

    if (stats.error) {
      logError(`Neo4j not configured: ${stats.error}`);
      return false;
    }

    logSuccess("Connected to Neo4j");

    log("\nNode counts:", colors.bright);
    for (const [label, count] of Object.entries(stats.nodes || {})) {
      console.log(`  ${label}: ${count}`);
    }

    log("\nRelationship counts:", colors.bright);
    for (const [type, count] of Object.entries(stats.relationships || {})) {
      console.log(`  ${type}: ${count}`);
    }

    if (!stats.nodes || Object.keys(stats.nodes).length === 0) {
      logWarning("No data in Neo4j! Run: npm run sync");
      return false;
    }

    return true;
  } catch (error) {
    logError(`Neo4j test failed: ${error.message}`);
    return false;
  }
}

async function testGraphRecommendations() {
  logHeader("Test 4: Graph-Based Recommendations");

  try {
    // Test with multiple users
    const testUsers = [1, 2, 3];

    for (const userId of testUsers) {
      log(`\nTesting recommendations for User ${userId}:`, colors.bright);

      const recommendations = await neo4jService.getGraphRecommendations(
        userId,
        5
      );

      if (!recommendations || recommendations.length === 0) {
        logWarning(
          `No recommendations for user ${userId} (may need more data)`
        );
        continue;
      }

      logSuccess(`Found ${recommendations.length} recommendations:`);
      recommendations.forEach((rec, idx) => {
        console.log(
          `  ${idx + 1}. Product ${rec.product_id}: ${
            rec.product_name || "N/A"
          } (score: ${rec.score})`
        );
      });
    }

    return true;
  } catch (error) {
    logError(`Graph recommendations test failed: ${error.message}`);
    return false;
  }
}

async function testCategoryRecommendations() {
  logHeader("Test 5: Category-Based Recommendations");

  try {
    const userId = 2;
    log(`Testing category recommendations for User ${userId}:`, colors.bright);

    const recommendations = await neo4jService.getCategoryRecommendations(
      userId,
      5
    );

    if (!recommendations || recommendations.length === 0) {
      logWarning(`No category recommendations for user ${userId}`);
      return true; // Not a failure, just no data
    }

    logSuccess(`Found ${recommendations.length} recommendations:`);
    recommendations.forEach((rec, idx) => {
      console.log(
        `  ${idx + 1}. Product ${rec.product_id}: ${
          rec.product_name || "N/A"
        } - ${rec.category} (score: ${rec.score})`
      );
    });

    return true;
  } catch (error) {
    logError(`Category recommendations test failed: ${error.message}`);
    return false;
  }
}

async function compareModels() {
  logHeader("Test 6: Compare All Three Models");

  const userId = 2;
  log(`Comparing recommendation models for User ${userId}:`, colors.bright);

  try {
    const pgService = require("../services/postgresService");

    // Collaborative filtering
    log("\n1. Collaborative Filtering (Postgres):", colors.blue);
    const collabRecs = await pgService.getCollaborativeRecommendations(
      userId,
      5
    );
    if (collabRecs.length > 0) {
      collabRecs.forEach((rec, idx) => {
        console.log(
          `  ${idx + 1}. Product ${rec.product_id} (score: ${rec.score})`
        );
      });
    } else {
      logWarning("  No recommendations");
    }

    // Content-based
    log("\n2. Content-Based (Postgres):", colors.blue);
    const contentRecs = await pgService.getContentRecommendations(userId, 5);
    if (contentRecs.length > 0) {
      contentRecs.forEach((rec, idx) => {
        console.log(
          `  ${idx + 1}. Product ${rec.product_id} (score: ${rec.score})`
        );
      });
    } else {
      logWarning("  No recommendations");
    }

    // Graph-based
    log("\n3. Graph-Based (Neo4j):", colors.blue);
    const graphRecs = await neo4jService.getGraphRecommendations(userId, 5);
    if (graphRecs.length > 0) {
      graphRecs.forEach((rec, idx) => {
        console.log(
          `  ${idx + 1}. Product ${rec.product_id} (score: ${rec.score})`
        );
      });
    } else {
      logWarning("  No recommendations");
    }

    // Compare overlap
    const collabIds = new Set(collabRecs.map((r) => r.product_id));
    const contentIds = new Set(contentRecs.map((r) => r.product_id));
    const graphIds = new Set(graphRecs.map((r) => r.product_id));

    const collabGraphOverlap = [...collabIds].filter((id) =>
      graphIds.has(id)
    ).length;
    const contentGraphOverlap = [...contentIds].filter((id) =>
      graphIds.has(id)
    ).length;
    const collabContentOverlap = [...collabIds].filter((id) =>
      contentIds.has(id)
    ).length;

    log("\nRecommendation Overlap:", colors.bright);
    console.log(
      `  Collab ∩ Graph: ${collabGraphOverlap}/${Math.min(
        collabIds.size,
        graphIds.size
      )}`
    );
    console.log(
      `  Content ∩ Graph: ${contentGraphOverlap}/${Math.min(
        contentIds.size,
        graphIds.size
      )}`
    );
    console.log(
      `  Collab ∩ Content: ${collabContentOverlap}/${Math.min(
        collabIds.size,
        contentIds.size
      )}`
    );

    logSuccess("Model comparison complete");
    return true;
  } catch (error) {
    logError(`Model comparison failed: ${error.message}`);
    return false;
  }
}

async function testABAssignment() {
  logHeader("Test 7: A/B Test Assignment");

  try {
    const abService = require("../services/abService");

    const userId = 1;
    log(`Getting A/B assignment for User ${userId}:`, colors.bright);

    const assignment = await abService.getOrAssignUserModel(userId);
    logSuccess(
      `User ${userId} assigned to model: ${assignment.model_name} (ID: ${assignment.model_id})`
    );

    // Test bulk assignment
    log("\nTesting bulk assignment:", colors.bright);
    const result = await abService.assignAllUsersEvenSplit([1, 2, 3]);
    logSuccess(`Assigned ${result.assigned}/${result.total} users`);

    return true;
  } catch (error) {
    logError(`A/B test failed: ${error.message}`);
    return false;
  }
}

async function testEventLogging() {
  logHeader("Test 8: Event Logging");

  try {
    const eventsService = require("../services/eventsService");

    log("Logging test events:", colors.bright);

    // Log impression
    await eventsService.logEvent({
      user_id: 1,
      product_id: 5,
      model_id: 3,
      event_type: "impression",
      metadata: { test: true },
    });
    logSuccess("Logged impression event");

    // Log click
    await eventsService.logEvent({
      user_id: 1,
      product_id: 5,
      model_id: 3,
      event_type: "click",
      metadata: { test: true },
    });
    logSuccess("Logged click event");

    // Get counts
    const counts = await eventsService.getCountsByModel(3);
    log("\nEvent counts for model 3:", colors.bright);
    counts.forEach((row) => {
      console.log(`  ${row.event_type}: ${row.cnt}`);
    });

    return true;
  } catch (error) {
    logError(`Event logging test failed: ${error.message}`);
    return false;
  }
}

async function runAllTests() {
  console.clear();
  log("\n🚀 Neo4j Integration Test Suite", colors.bright + colors.blue);
  log("Testing all components of the recommendation system\n");

  const results = {
    passed: 0,
    failed: 0,
    warnings: 0,
  };

  const tests = [
    testPostgresConnection,
    testPostgresData,
    testNeo4jConnection,
    testGraphRecommendations,
    testCategoryRecommendations,
    compareModels,
    testABAssignment,
    testEventLogging,
  ];

  for (const test of tests) {
    try {
      const passed = await test();
      if (passed) {
        results.passed++;
      } else {
        results.failed++;
      }
    } catch (error) {
      results.failed++;
      logError(`Unexpected error: ${error.message}`);
    }
  }

  // Summary
  logHeader("Test Summary");
  log(`Total: ${tests.length}`, colors.bright);
  logSuccess(`Passed: ${results.passed}`);
  if (results.failed > 0) {
    logError(`Failed: ${results.failed}`);
  }

  if (results.passed === tests.length) {
    log(
      "\n🎉 All tests passed! Your Neo4j integration is working perfectly.",
      colors.green
    );
  } else if (results.passed >= 5) {
    log(
      "\n⚠️  Most tests passed. Check warnings above for optimization tips.",
      colors.yellow
    );
  } else {
    log(
      "\n❌ Some tests failed. Check errors above and review the setup guide.",
      colors.red
    );
  }

  console.log("\n" + "=".repeat(60) + "\n");

  // Cleanup
  await pool.end();
  await neo4jService.close();
}

// Run tests
if (require.main === module) {
  runAllTests()
    .then(() => {
      process.exit(0);
    })
    .catch((error) => {
      logError(`Fatal error: ${error.message}`);
      process.exit(1);
    });
}

module.exports = { runAllTests };

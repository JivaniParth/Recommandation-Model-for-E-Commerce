/**
 * Complete Neo4j Sync Script
 * Syncs users, products, and purchase interactions from Postgres to Neo4j
 */
require("dotenv").config();
const neo4j = require("neo4j-driver");
const { Pool } = require("pg");

// Initialize connections
const pgPool = new Pool({
  connectionString: process.env.DATABASE_URL || process.env.PG_CONNECTION,
});

const neo4jDriver = neo4j.driver(
  process.env.NEO4J_URI || "bolt://localhost:7687",
  neo4j.auth.basic(
    process.env.NEO4J_USER || "neo4j",
    process.env.NEO4J_PASSWORD || "password"
  )
);

/**
 * Clear existing Neo4j data (optional - use with caution!)
 */
async function clearNeo4jData(session) {
  console.log("🗑️  Clearing existing Neo4j data...");
  await session.run("MATCH (n) DETACH DELETE n");
  console.log("✅ Neo4j data cleared");
}

/**
 * Create constraints and indexes in Neo4j for better performance
 */
async function createConstraintsAndIndexes(session) {
  console.log("📋 Creating Neo4j constraints and indexes...");

  const commands = [
    // Constraints (ensures uniqueness and creates index)
    "CREATE CONSTRAINT user_id_unique IF NOT EXISTS FOR (u:User) REQUIRE u.id IS UNIQUE",
    "CREATE CONSTRAINT product_id_unique IF NOT EXISTS FOR (p:Product) REQUIRE p.id IS UNIQUE",

    // Additional indexes for performance
    "CREATE INDEX user_email IF NOT EXISTS FOR (u:User) ON (u.email)",
    "CREATE INDEX product_category IF NOT EXISTS FOR (p:Product) ON (p.category)",
    "CREATE INDEX product_sku IF NOT EXISTS FOR (p:Product) ON (p.sku)",
  ];

  for (const cmd of commands) {
    try {
      await session.run(cmd);
      console.log(`  ✓ ${cmd.split(" ")[1]}`);
    } catch (err) {
      // Constraint/index might already exist
      if (!err.message.includes("already exists")) {
        console.warn(`  ⚠️  ${err.message}`);
      }
    }
  }

  console.log("✅ Constraints and indexes ready");
}

/**
 * Sync users from Postgres to Neo4j
 */
async function syncUsers(pgClient, neo4jSession) {
  console.log("\n👥 Syncing users...");

  const { rows: users } = await pgClient.query(
    "SELECT id, username, email, created_at FROM users ORDER BY id"
  );

  if (!users || users.length === 0) {
    console.log("  ⚠️  No users found in Postgres");
    return 0;
  }

  let syncedCount = 0;

  for (const user of users) {
    await neo4jSession.run(
      `
      MERGE (u:User {id: $id})
      SET u.username = $username,
          u.email = $email,
          u.created_at = datetime($created_at)
      `,
      {
        id: neo4j.int(user.id),
        username: user.username || "",
        email: user.email || "",
        created_at: user.created_at
          ? user.created_at.toISOString()
          : new Date().toISOString(),
      }
    );
    syncedCount++;
  }

  console.log(`✅ Synced ${syncedCount} users`);
  return syncedCount;
}

/**
 * Sync products from Postgres to Neo4j
 */
async function syncProducts(pgClient, neo4jSession) {
  console.log("\n📦 Syncing products...");

  const { rows: products } = await pgClient.query(
    "SELECT id, sku, name, category, price FROM products ORDER BY id"
  );

  if (!products || products.length === 0) {
    console.log("  ⚠️  No products found in Postgres");
    return 0;
  }

  let syncedCount = 0;

  for (const product of products) {
    await neo4jSession.run(
      `
      MERGE (p:Product {id: $id})
      SET p.sku = $sku,
          p.name = $name,
          p.category = $category,
          p.price = $price
      `,
      {
        id: neo4j.int(product.id),
        sku: product.sku || "",
        name: product.name || "",
        category: product.category || "",
        price: product.price ? parseFloat(product.price) : 0.0,
      }
    );
    syncedCount++;
  }

  console.log(`✅ Synced ${syncedCount} products`);
  return syncedCount;
}

/**
 * Sync user interactions (purchases, views, cart additions) from Postgres to Neo4j
 */
async function syncInteractions(pgClient, neo4jSession) {
  console.log("\n🔗 Syncing interactions...");

  const { rows: interactions } = await pgClient.query(
    `
    SELECT ui.id, ui.user_id, ui.product_id, ui.interaction_type, ui.ts
    FROM user_interactions ui
    ORDER BY ui.ts
    `
  );

  if (!interactions || interactions.length === 0) {
    console.log("  ⚠️  No interactions found in Postgres");
    return 0;
  }

  let purchaseCount = 0;
  let viewCount = 0;
  let cartCount = 0;

  for (const interaction of interactions) {
    const type = interaction.interaction_type.toLowerCase();

    if (type === "purchase") {
      await neo4jSession.run(
        `
        MATCH (u:User {id: $userId})
        MATCH (p:Product {id: $productId})
        MERGE (u)-[r:PURCHASED]->(p)
        SET r.timestamp = datetime($timestamp),
            r.interaction_id = $interactionId
        `,
        {
          userId: neo4j.int(interaction.user_id),
          productId: neo4j.int(interaction.product_id),
          timestamp: interaction.ts
            ? interaction.ts.toISOString()
            : new Date().toISOString(),
          interactionId: neo4j.int(interaction.id),
        }
      );
      purchaseCount++;
    } else if (type === "view") {
      await neo4jSession.run(
        `
        MATCH (u:User {id: $userId})
        MATCH (p:Product {id: $productId})
        MERGE (u)-[r:VIEWED]->(p)
        SET r.timestamp = datetime($timestamp),
            r.interaction_id = $interactionId
        `,
        {
          userId: neo4j.int(interaction.user_id),
          productId: neo4j.int(interaction.product_id),
          timestamp: interaction.ts
            ? interaction.ts.toISOString()
            : new Date().toISOString(),
          interactionId: neo4j.int(interaction.id),
        }
      );
      viewCount++;
    } else if (type === "cart_add") {
      await neo4jSession.run(
        `
        MATCH (u:User {id: $userId})
        MATCH (p:Product {id: $productId})
        MERGE (u)-[r:ADDED_TO_CART]->(p)
        SET r.timestamp = datetime($timestamp),
            r.interaction_id = $interactionId
        `,
        {
          userId: neo4j.int(interaction.user_id),
          productId: neo4j.int(interaction.product_id),
          timestamp: interaction.ts
            ? interaction.ts.toISOString()
            : new Date().toISOString(),
          interactionId: neo4j.int(interaction.id),
        }
      );
      cartCount++;
    }
  }

  console.log(`✅ Synced ${interactions.length} interactions:`);
  console.log(`   - Purchases: ${purchaseCount}`);
  console.log(`   - Views: ${viewCount}`);
  console.log(`   - Cart adds: ${cartCount}`);

  return interactions.length;
}

/**
 * Verify sync by running test queries
 */
async function verifySyncedData(session) {
  console.log("\n🔍 Verifying synced data...");

  // Count nodes
  const nodeCount = await session.run(`
    MATCH (n)
    RETURN labels(n)[0] as label, count(n) as count
  `);

  console.log("  Node counts:");
  nodeCount.records.forEach((record) => {
    console.log(`    ${record.get("label")}: ${record.get("count")}`);
  });

  // Count relationships
  const relCount = await session.run(`
    MATCH ()-[r]->()
    RETURN type(r) as type, count(r) as count
  `);

  console.log("  Relationship counts:");
  relCount.records.forEach((record) => {
    console.log(`    ${record.get("type")}: ${record.get("count")}`);
  });

  // Sample collaborative filtering query
  console.log("\n  Testing sample recommendation query...");
  const testQuery = await session.run(`
    MATCH (u:User {id: 2})-[:PURCHASED]->(p1:Product)<-[:PURCHASED]-(other:User)
    MATCH (other)-[:PURCHASED]->(p2:Product)
    WHERE NOT (u)-[:PURCHASED]->(p2) AND u <> other
    RETURN p2.id as product_id, p2.name as product_name, count(DISTINCT other) as score
    ORDER BY score DESC
    LIMIT 5
  `);

  if (testQuery.records.length > 0) {
    console.log("  ✅ Sample recommendations for User 2:");
    testQuery.records.forEach((record) => {
      console.log(
        `    - Product ${record.get("product_id")}: ${record.get(
          "product_name"
        )} (score: ${record.get("score")})`
      );
    });
  } else {
    console.log(
      "  ⚠️  No recommendations found (may need more interaction data)"
    );
  }
}

/**
 * Main sync function
 */
async function run() {
  const startTime = Date.now();
  console.log("🚀 Starting Neo4j sync from Postgres...\n");

  let pgClient;
  let neo4jSession;

  try {
    // Connect to Postgres
    console.log("📡 Connecting to Postgres...");
    pgClient = await pgPool.connect();
    console.log("✅ Connected to Postgres");

    // Connect to Neo4j
    console.log("📡 Connecting to Neo4j...");
    neo4jSession = neo4jDriver.session();
    await neo4jSession.run("RETURN 1"); // Test connection
    console.log("✅ Connected to Neo4j");

    // Optional: Clear existing data (uncomment to enable)
    // await clearNeo4jData(neo4jSession);

    // Create constraints and indexes
    await createConstraintsAndIndexes(neo4jSession);

    // Sync data
    const userCount = await syncUsers(pgClient, neo4jSession);
    const productCount = await syncProducts(pgClient, neo4jSession);
    const interactionCount = await syncInteractions(pgClient, neo4jSession);

    // Verify
    await verifySyncedData(neo4jSession);

    const duration = ((Date.now() - startTime) / 1000).toFixed(2);
    console.log("\n" + "=".repeat(50));
    console.log("✅ Sync completed successfully!");
    console.log(`   Duration: ${duration}s`);
    console.log(`   Users: ${userCount}`);
    console.log(`   Products: ${productCount}`);
    console.log(`   Interactions: ${interactionCount}`);
    console.log("=".repeat(50) + "\n");
  } catch (error) {
    console.error("\n❌ Sync failed:", error.message);
    console.error(error.stack);
    throw error;
  } finally {
    // Cleanup connections
    if (pgClient) {
      pgClient.release();
      console.log("🔌 Postgres connection released");
    }
    if (neo4jSession) {
      await neo4jSession.close();
      console.log("🔌 Neo4j session closed");
    }
    await pgPool.end();
    await neo4jDriver.close();
    console.log("🔌 All connections closed");
  }
}

// Run if called directly
if (require.main === module) {
  run()
    .then(() => {
      console.log("👋 Sync script finished");
      process.exit(0);
    })
    .catch((error) => {
      console.error("💥 Fatal error:", error.message);
      process.exit(1);
    });
}

module.exports = { run };

// recommendation-model/scripts/syncProductsToMongo.js
// Script to sync products from Oracle to MongoDB for content-based recommendations

require("dotenv").config();
const oracledb = require("oracledb");
const { MongoClient } = require("mongodb");

// Oracle configuration
const oracleConfig = {
  user: process.env.ORACLE_USER || "BOOKSTORE_ADMIN",
  password: process.env.ORACLE_PASSWORD || "admin123",
  connectString:
    process.env.ORACLE_CONNECTION_STRING || "localhost:1521/FREEPDB1",
};

// MongoDB configuration
const MONGO_URI = process.env.MONGODB_URI || "mongodb://localhost:27017";
const DB_NAME = process.env.MONGODB_DB_NAME || "bookstore_recommendations";

async function syncProducts() {
  let oracleConnection = null;
  let mongoClient = null;

  try {
    console.log("🚀 Starting product sync from Oracle to MongoDB...\n");

    // Initialize Oracle Client
    const instantClientPath =
      process.env.ORACLE_INSTANT_CLIENT_PATH ||
      "C:\\oracle\\instantclient_23_9";
    try {
      oracledb.initOracleClient({ libDir: instantClientPath });
      console.log("✅ Oracle client initialized");
    } catch (err) {
      if (!err.message.includes("already been initialized")) {
        throw err;
      }
    }

    // Connect to Oracle
    console.log("📊 Connecting to Oracle...");
    oracleConnection = await oracledb.getConnection(oracleConfig);
    console.log("✅ Connected to Oracle");

    // Connect to MongoDB
    console.log("🍃 Connecting to MongoDB...");
    mongoClient = new MongoClient(MONGO_URI);
    await mongoClient.connect();
    const db = mongoClient.db(DB_NAME);
    const productsCollection = db.collection("products");
    console.log("✅ Connected to MongoDB\n");

    // Fetch products from Oracle
    console.log("📥 Fetching products from Oracle...");
    const result = await oracleConnection.execute(
      `
      SELECT 
        b.isbn,
        b.title,
        b.price,
        b.stock_quantity,
        b.pages,
        b.description,
        b.image_url,
        b.publication_date,
        a.author_name,
        p.publisher_name,
        c.category_name,
        NVL((SELECT AVG(rating) FROM reviews WHERE isbn = b.isbn), 0) as avg_rating,
        NVL((SELECT COUNT(*) FROM reviews WHERE isbn = b.isbn), 0) as review_count,
        NVL((SELECT COUNT(*) FROM order_items WHERE isbn = b.isbn), 0) as purchase_count
      FROM books b
      LEFT JOIN authors a ON b.author_name = a.author_name
      LEFT JOIN publishers p ON b.publisher_name = p.publisher_name
      LEFT JOIN categories c ON b.category_name = c.category_name
      ORDER BY b.isbn
      `,
      [],
      { outFormat: oracledb.OUT_FORMAT_OBJECT }
    );

    console.log(`✅ Fetched ${result.rows.length} products from Oracle\n`);

    if (result.rows.length === 0) {
      console.log("⚠️ No products found in Oracle database");
      return;
    }

    // Transform and insert products into MongoDB
    console.log("💾 Syncing products to MongoDB...");
    let successCount = 0;
    let errorCount = 0;

    for (const row of result.rows) {
      try {
        // Handle CLOB data for description
        let description = "";
        if (row.DESCRIPTION) {
          if (typeof row.DESCRIPTION === "string") {
            description = row.DESCRIPTION;
          } else if (row.DESCRIPTION.getData) {
            // It's a CLOB, read it
            description = await row.DESCRIPTION.getData();
          }
        }

        // Extract keywords from title and description for better content matching
        const titleWords = row.TITLE
          ? row.TITLE.toLowerCase().split(/\s+/)
          : [];
        const descWords = description
          ? description.toLowerCase().split(/\s+/).slice(0, 20)
          : [];
        const keywords = [...new Set([...titleWords, ...descWords])];

        // Calculate popularity score based on purchases and ratings
        const popularityScore =
          (row.PURCHASE_COUNT || 0) * 2 +
          (row.AVG_RATING || 0) * 10 +
          (row.REVIEW_COUNT || 0);

        const product = {
          product_id: row.ISBN,
          title: row.TITLE,
          author: row.AUTHOR_NAME,
          publisher: row.PUBLISHER_NAME,
          category: row.CATEGORY_NAME,
          price: row.PRICE,
          stock: row.STOCK_QUANTITY || 0,
          pages: row.PAGES,
          description: description || "",
          image: row.IMAGE_URL,
          publication_date: row.PUBLICATION_DATE,
          rating: parseFloat(row.AVG_RATING) || 0,
          review_count: parseInt(row.REVIEW_COUNT) || 0,
          purchase_count: parseInt(row.PURCHASE_COUNT) || 0,
          popularity_score: popularityScore,
          tags: keywords.filter((w) => w.length > 3).slice(0, 10), // Top 10 keywords
          synced_at: new Date(),
        };

        await productsCollection.updateOne(
          { product_id: row.ISBN },
          { $set: product },
          { upsert: true }
        );

        successCount++;
        if (successCount % 10 === 0) {
          process.stdout.write(
            `\r   Synced ${successCount}/${result.rows.length} products...`
          );
        }
      } catch (err) {
        errorCount++;
        console.error(`\n❌ Error syncing product ${row.ISBN}:`, err.message);
      }
    }

    console.log(`\n\n✅ Sync completed successfully!`);
    console.log(`   - Total products: ${result.rows.length}`);
    console.log(`   - Successfully synced: ${successCount}`);
    console.log(`   - Errors: ${errorCount}`);

    // Create indexes
    console.log("\n📑 Creating MongoDB indexes...");
    await productsCollection.createIndex({
      title: "text",
      author: "text",
      category: "text",
      description: "text",
    });
    await productsCollection.createIndex({ category: 1 });
    await productsCollection.createIndex({ author: 1 });
    await productsCollection.createIndex({ popularity_score: -1 });
    console.log("✅ Indexes created successfully");

    console.log("\n🎉 Product sync completed!");
  } catch (error) {
    console.error("\n❌ Error during sync:", error);
    throw error;
  } finally {
    // Close connections
    if (oracleConnection) {
      try {
        await oracleConnection.close();
        console.log("\n🔌 Oracle connection closed");
      } catch (err) {
        console.error("Error closing Oracle connection:", err);
      }
    }

    if (mongoClient) {
      try {
        await mongoClient.close();
        console.log("🔌 MongoDB connection closed");
      } catch (err) {
        console.error("Error closing MongoDB connection:", err);
      }
    }
  }
}

// Run the sync
syncProducts()
  .then(() => {
    console.log("\n✅ All done!");
    process.exit(0);
  })
  .catch((err) => {
    console.error("\n❌ Fatal error:", err);
    process.exit(1);
  });

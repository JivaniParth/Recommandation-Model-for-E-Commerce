// ecommerce-backend/db/oracleDb.js
const oracledb = require("oracledb");
const path = require("path");
const fs = require("fs");

// Enable auto-commit for every statement
oracledb.autoCommit = true;

// Configure Oracle client
// Set this to your Oracle Instant Client location if needed
const instantClientPath =
  process.env.ORACLE_INSTANT_CLIENT_PATH || "C:\\oracle\\instantclient_23_9";

// Only initialize if the path exists or if ORACLE_INSTANT_CLIENT_PATH is explicitly set
if (
  process.env.ORACLE_INSTANT_CLIENT_PATH ||
  fs.existsSync(instantClientPath)
) {
  try {
    oracledb.initOracleClient({
      libDir: instantClientPath,
    });
    console.log(
      `✅ Oracle Instant Client initialized from: ${instantClientPath}`
    );
  } catch (err) {
    console.error("❌ Failed to initialize Oracle Client:", err.message);
    console.log("\n📋 To fix this:");
    console.log("1. Download Oracle Instant Client from:");
    console.log(
      "   https://www.oracle.com/database/technologies/instant-client/winx64-64-downloads.html"
    );
    console.log(
      "2. Extract it to a directory (e.g., C:\\oracle\\instantclient_23_9)"
    );
    console.log(
      "3. Set the environment variable ORACLE_INSTANT_CLIENT_PATH to that directory"
    );
    console.log("   OR add the directory to your Windows PATH");
    process.exit(1);
  }
} else {
  console.error("❌ Oracle Instant Client not found!");
  console.log(`\n📍 Checked path: ${instantClientPath}`);
  console.log("\n📋 To fix this:");
  console.log("1. Download Oracle Instant Client from:");
  console.log(
    "   https://www.oracle.com/database/technologies/instant-client/winx64-64-downloads.html"
  );
  console.log(
    "2. Extract it to a directory (e.g., C:\\oracle\\instantclient_23_9)"
  );
  console.log(
    "3. Set the environment variable ORACLE_INSTANT_CLIENT_PATH in your .env file:"
  );
  console.log("   ORACLE_INSTANT_CLIENT_PATH=C:\\oracle\\instantclient_23_9");
  console.log(
    "   OR add the directory to your Windows PATH environment variable"
  );
  process.exit(1);
}

const dbConfig = {
  user: process.env.ORACLE_USER,
  password: process.env.ORACLE_PASSWORD,
  connectString: process.env.ORACLE_CONNECTION_STRING,
};

// Create connection pool
let pool;

async function initialize() {
  try {
    pool = await oracledb.createPool({
      user: dbConfig.user,
      password: dbConfig.password,
      connectString: dbConfig.connectString,
      poolMin: 2,
      poolMax: 10,
      poolIncrement: 2,
      poolTimeout: 60,
    });
    console.log("✅ Oracle Database connection pool created successfully");
    console.log(`📊 Connected to: ${dbConfig.connectString}`);
  } catch (err) {
    console.error("❌ Error creating Oracle connection pool:", err);
    throw err;
  }
}

async function close() {
  try {
    if (pool) {
      await pool.close(10);
      console.log("🔌 Oracle connection pool closed");
    }
  } catch (err) {
    console.error("Error closing Oracle pool:", err);
  }
}

async function execute(sql, binds = [], options = {}) {
  let connection;
  try {
    connection = await pool.getConnection();
    const result = await connection.execute(sql, binds, options);
    return result;
  } catch (err) {
    console.error("Oracle execute error:", err);
    throw err;
  } finally {
    if (connection) {
      try {
        await connection.close();
      } catch (err) {
        console.error("Error closing connection:", err);
      }
    }
  }
}

// Helper function to convert Oracle result to array of objects
function resultToArray(result) {
  if (!result.rows || result.rows.length === 0) {
    return [];
  }

  const columns = result.metaData.map((col) => col.name.toLowerCase());

  return result.rows.map((row) => {
    const obj = {};
    columns.forEach((col, index) => {
      obj[col] = row[index];
    });
    return obj;
  });
}

module.exports = {
  initialize,
  close,
  execute,
  resultToArray,
  OUT_FORMAT_OBJECT: oracledb.OUT_FORMAT_OBJECT,
  BIND_OUT: oracledb.BIND_OUT,
  NUMBER: oracledb.NUMBER,
  STRING: oracledb.STRING,
  DATE: oracledb.DATE,
  get pool() {
    return pool;
  },
};

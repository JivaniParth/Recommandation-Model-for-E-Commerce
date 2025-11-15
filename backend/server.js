// ecommerce-backend/server.js
require("dotenv").config();
console.log("🔍 Environment check:");
console.log("  ORACLE_USER:", process.env.ORACLE_USER ? "✓" : "✗");
console.log("  ORACLE_PASSWORD:", process.env.ORACLE_PASSWORD ? "✓" : "✗");
console.log(
  "  ORACLE_CONNECTION_STRING:",
  process.env.ORACLE_CONNECTION_STRING
);
console.log("  JWT_SECRET exists:", !!process.env.JWT_SECRET);
console.log("  PORT:", process.env.PORT || "using default");

const express = require("express");
const cors = require("cors");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");
const db = require("./db/oracleDb");

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(
  cors({
    origin: "http://localhost:5173",
    credentials: true,
  })
);
app.use(express.json());

// Initialize database connection
console.log("🔧 Initializing Oracle database connection...");
db.initialize()
  .then(() => {
    console.log("✅ Database initialized successfully");
    startServer();
  })
  .catch((err) => {
    console.error("❌ Failed to initialize database:", err);
    process.exit(1);
  });

// JWT Secret
const JWT_SECRET = process.env.JWT_SECRET || "mySecretKey123!BookStoreApp2025";

// ==================== MIDDLEWARE ====================

const authMiddleware = async (req, res, next) => {
  try {
    const token = req.headers.authorization?.split(" ")[1];
    if (!token) {
      return res
        .status(401)
        .json({ success: false, message: "No token provided" });
    }

    const decoded = jwt.verify(token, JWT_SECRET);
    req.userId = decoded.userId;
    req.userType = decoded.userType;
    next();
  } catch (error) {
    return res.status(401).json({ success: false, message: "Invalid token" });
  }
};

const adminMiddleware = (req, res, next) => {
  if (req.userType !== "admin") {
    return res
      .status(403)
      .json({ success: false, message: "Admin access required" });
  }
  next();
};

// ==================== AUTH ROUTES ====================

// Register
app.post("/api/auth/register", async (req, res) => {
  try {
    const { firstName, lastName, email, password, phone } = req.body;

    // Check if user exists
    const existingUser = await db.execute(
      "SELECT * FROM users WHERE email = :email",
      [email],
      { outFormat: db.OUT_FORMAT_OBJECT }
    );

    if (existingUser.rows.length > 0) {
      return res
        .status(400)
        .json({ success: false, error: "User already exists" });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Insert user
    const result = await db.execute(
      `INSERT INTO users (first_name, last_name, email, password_hash, phone, user_type)
       VALUES (:firstName, :lastName, :email, :password, :phone, 'customer')
       RETURNING user_id, first_name, last_name, email, phone, user_type, created_at INTO :id, :fname, :lname, :email_out, :phone_out, :type, :created`,
      {
        firstName,
        lastName,
        email,
        password: hashedPassword,
        phone: phone || null,
        id: { dir: db.BIND_OUT, type: db.NUMBER },
        fname: { dir: db.BIND_OUT, type: db.STRING },
        lname: { dir: db.BIND_OUT, type: db.STRING },
        email_out: { dir: db.BIND_OUT, type: db.STRING },
        phone_out: { dir: db.BIND_OUT, type: db.STRING },
        type: { dir: db.BIND_OUT, type: db.STRING },
        created: { dir: db.BIND_OUT, type: db.DATE },
      },
      { autoCommit: true }
    );

    const userId = result.outBinds.id;

    // Generate token
    const token = jwt.sign(
      { userId: userId, userType: "customer" },
      JWT_SECRET,
      { expiresIn: "7d" }
    );

    res.json({
      success: true,
      token,
      user: {
        id: userId,
        firstName: result.outBinds.fname,
        lastName: result.outBinds.lname,
        email: result.outBinds.email_out,
        phone: result.outBinds.phone_out,
        user_type: result.outBinds.type,
        joinedDate: result.outBinds.created
          ? result.outBinds.created.toISOString()
          : null,
        avatar: `https://ui-avatars.com/api/?name=${firstName}+${lastName}&background=6366f1&color=fff`,
      },
    });
  } catch (error) {
    console.error("Registration error:", error);
    res.status(500).json({ success: false, error: "Registration failed" });
  }
});

// Login
app.post("/api/auth/login", async (req, res) => {
  // Changed: use named binds and normalize email to avoid accidental "Invalid credentials"
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res
        .status(400)
        .json({ success: false, error: "Email and password required" });
    }

    const normalizedEmail = email.toLowerCase().trim();
    const result = await db.execute(
      "SELECT * FROM users WHERE LOWER(email) = :email",
      { email: normalizedEmail },
      { outFormat: db.OUT_FORMAT_OBJECT }
    );

    if (result.rows.length === 0) {
      return res
        .status(401)
        .json({ success: false, error: "Invalid credentials" });
    }

    const user = result.rows[0];
    const storedHash =
      user.PASSWORD_HASH || user.password_hash || user.Password_hash;
    if (!storedHash) {
      console.error("Login: no password hash found for user", user);
      return res
        .status(401)
        .json({ success: false, error: "Invalid credentials" });
    }

    const validPassword = await bcrypt.compare(password, storedHash);

    if (!validPassword) {
      return res
        .status(401)
        .json({ success: false, error: "Invalid credentials" });
    }

    const token = jwt.sign(
      { userId: user.USER_ID, userType: user.USER_TYPE },
      JWT_SECRET,
      { expiresIn: "7d" }
    );

    res.json({
      success: true,
      token,
      user: {
        id: user.USER_ID,
        firstName: user.FIRST_NAME,
        lastName: user.LAST_NAME,
        email: user.EMAIL,
        phone: user.PHONE,
        address: user.ADDRESS,
        city: user.CITY,
        postalCode: user.POSTAL_CODE,
        user_type: user.USER_TYPE,
        joinedDate: user.CREATED_AT ? user.CREATED_AT.toISOString() : null,
        avatar: `https://ui-avatars.com/api/?name=${user.FIRST_NAME}+${user.LAST_NAME}&background=6366f1&color=fff`,
      },
    });
  } catch (error) {
    console.error("Login error:", error);
    res.status(500).json({ success: false, error: "Login failed" });
  }
});

// Verify token
// Re-enable auth middleware (was temporarily mocked)
app.get("/api/auth/verify", authMiddleware, async (req, res) => {
  try {
    const result = await db.execute(
      "SELECT * FROM users WHERE user_id = :id",
      { id: req.userId },
      { outFormat: db.OUT_FORMAT_OBJECT }
    );

    if (result.rows.length === 0) {
      return res
        .status(404)
        .json({ success: false, message: "User not found" });
    }

    const user = result.rows[0];
    res.json({
      success: true,
      user: {
        id: user.USER_ID,
        firstName: user.FIRST_NAME,
        lastName: user.LAST_NAME,
        email: user.EMAIL,
        phone: user.PHONE,
        address: user.ADDRESS,
        city: user.CITY,
        postalCode: user.POSTAL_CODE,
        user_type: user.USER_TYPE,
        joinedDate: user.CREATED_AT ? user.CREATED_AT.toISOString() : null,
        avatar: `https://ui-avatars.com/api/?name=${user.FIRST_NAME}+${user.LAST_NAME}&background=6366f1&color=fff`,
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: "Verification failed" });
  }
});

// ==================== PASSWORD RESET ====================

// Request password reset (generates a token and stores it)
app.post("/api/auth/forgot-password", async (req, res) => {
  try {
    const { email } = req.body;
    if (!email)
      return res
        .status(400)
        .json({ success: false, message: "Email required" });

    const normalizedEmail = email.toLowerCase().trim();
    const userResult = await db.execute(
      "SELECT user_id, email FROM users WHERE LOWER(email) = :email",
      { email: normalizedEmail },
      { outFormat: db.OUT_FORMAT_OBJECT }
    );

    if (userResult.rows.length === 0) {
      // Do not reveal whether email exists in production; here we return success for UX parity
      return res.json({
        success: true,
        message: "If the email exists, a reset token was generated",
      });
    }

    const user = userResult.rows[0];

    // Ensure password_resets table exists (best-effort; ignore error if already exists)
    try {
      await db.execute(
        `CREATE TABLE password_resets (
					id NUMBER GENERATED BY DEFAULT ON NULL AS IDENTITY PRIMARY KEY,
					user_id NUMBER NOT NULL,
					token VARCHAR2(255) NOT NULL,
					expires_at TIMESTAMP NOT NULL,
					created_at TIMESTAMP DEFAULT SYSTIMESTAMP
				)`,
        {},
        { autoCommit: true }
      );
    } catch (e) {
      // ORA-00955: name is already used by an existing object (table exists) - ignore
    }

    // Generate reset token (simple random string)
    const resetToken = require("crypto").randomBytes(24).toString("hex");
    // Expires in 1 hour
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000);

    await db.execute(
      `INSERT INTO password_resets (user_id, token, expires_at) VALUES (:userId, :token, :expires)`,
      {
        userId: user.USER_ID,
        token: resetToken,
        expires: expiresAt,
      },
      { autoCommit: true }
    );

    // In production: email the resetToken to the user's email. For development return token in response.
    res.json({
      success: true,
      message: "Reset token generated",
      token: resetToken,
    });
  } catch (error) {
    console.error("Forgot password error:", error);
    res
      .status(500)
      .json({ success: false, message: "Failed to generate reset token" });
  }
});

// Reset password using token
app.post("/api/auth/reset-password", async (req, res) => {
  try {
    const { token, newPassword } = req.body;
    if (!token || !newPassword)
      return res
        .status(400)
        .json({ success: false, message: "Token and new password required" });

    const tokenResult = await db.execute(
      `SELECT pr.user_id, pr.expires_at, u.email FROM password_resets pr JOIN users u ON pr.user_id = u.user_id WHERE pr.token = :token`,
      { token },
      { outFormat: db.OUT_FORMAT_OBJECT }
    );

    if (tokenResult.rows.length === 0) {
      return res
        .status(400)
        .json({ success: false, message: "Invalid or expired token" });
    }

    const row = tokenResult.rows[0];
    const expiresAt = new Date(row.EXPIRES_AT);
    if (expiresAt < new Date()) {
      // Clean up expired token
      await db.execute(
        `DELETE FROM password_resets WHERE token = :token`,
        { token },
        { autoCommit: true }
      );
      return res
        .status(400)
        .json({ success: false, message: "Invalid or expired token" });
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);

    await db.execute(
      `UPDATE users SET password_hash = :hash WHERE user_id = :userId`,
      { hash: hashedPassword, userId: row.USER_ID },
      { autoCommit: true }
    );

    // Delete token after use
    await db.execute(
      `DELETE FROM password_resets WHERE token = :token`,
      { token },
      { autoCommit: true }
    );

    res.json({ success: true, message: "Password has been reset" });
  } catch (error) {
    console.error("Reset password error:", error);
    res
      .status(500)
      .json({ success: false, message: "Failed to reset password" });
  }
});

// ==================== USER PROFILE ====================

app.put("/api/user/profile", authMiddleware, async (req, res) => {
  try {
    const { firstName, lastName, email, phone, address, city, postalCode } =
      req.body;

    await db.execute(
      `UPDATE users SET
        first_name = :firstName, 
        last_name = :lastName, 
        email = :email, 
        phone = :phone,
        address = :address, 
        city = :city, 
        postal_code = :postalCode
       WHERE user_id = :userId`,
      {
        firstName,
        lastName,
        email,
        phone: phone || null,
        address: address || null,
        city: city || null,
        postalCode: postalCode || null,
        userId: req.userId,
      },
      { autoCommit: true }
    );

    const result = await db.execute(
      "SELECT * FROM users WHERE user_id = :id",
      [req.userId],
      { outFormat: db.OUT_FORMAT_OBJECT }
    );

    const user = result.rows[0];
    res.json({
      success: true,
      user: {
        id: user.USER_ID,
        firstName: user.FIRST_NAME,
        lastName: user.LAST_NAME,
        email: user.EMAIL,
        phone: user.PHONE,
        address: user.ADDRESS,
        city: user.CITY,
        postalCode: user.POSTAL_CODE,
        user_type: user.USER_TYPE,
        joinedDate: user.CREATED_AT ? user.CREATED_AT.toISOString() : null,
        avatar: `https://ui-avatars.com/api/?name=${user.FIRST_NAME}+${user.LAST_NAME}&background=6366f1&color=fff`,
      },
    });
  } catch (error) {
    console.error("Profile update error:", error);
    res.status(500).json({ success: false, error: "Profile update failed" });
  }
});

// ==================== BOOKS ====================

// Simple recommendation endpoint (fallback when Neo4j is not available)
app.get("/api/books/recommendations/:userId", async (req, res) => {
  try {
    const userId = req.params.userId;
    const limit = parseInt(req.query.limit) || 6;

    // Get random books from Oracle as recommendations
    const query = `
      SELECT 
        b.isbn as id, 
        b.isbn, 
        b.title, 
        b.price, 
        b.stock_quantity as stock,
        b.pages, 
        b.description, 
        b.image_url as image, 
        b.publication_date as publicationDate,
        a.author_name as author,
        p.publisher_name as publisher,
        c.category_name as categoryName,
        c.category_id,
        NVL((SELECT AVG(rating) FROM reviews WHERE isbn = b.isbn), 0) as rating,
        NVL((SELECT COUNT(*) FROM reviews WHERE isbn = b.isbn), 0) as reviews,
        DBMS_RANDOM.VALUE(5, 10) as score
      FROM books b
      LEFT JOIN authors a ON b.author_name = a.author_name
      LEFT JOIN publishers p ON b.publisher_name = p.publisher_name
      LEFT JOIN categories c ON b.category_name = c.category_name
      WHERE b.stock_quantity > 0
      ORDER BY DBMS_RANDOM.VALUE
      FETCH FIRST :limit ROWS ONLY
    `;

    const result = await db.execute(query, { limit }, {
      outFormat: db.OUT_FORMAT_OBJECT,
      fetchInfo: {
        DESCRIPTION: { type: db.STRING }
      }
    });

    const recommendations = result.rows.map((row) => ({
      product_id: row.ISBN,
      product_name: row.TITLE,
      product_image: row.IMAGE,
      isbn: row.ISBN,
      title: row.TITLE,
      price: row.PRICE,
      stock: row.STOCK,
      pages: row.PAGES,
      description: row.DESCRIPTION || '',
      image: row.IMAGE,
      publicationdate: row.PUBLICATIONDATE ? row.PUBLICATIONDATE.toISOString() : null,
      author: row.AUTHOR,
      publisher: row.PUBLISHER,
      categoryname: row.CATEGORYNAME,
      category_id: row.CATEGORY_ID,
      rating: row.RATING || 0,
      reviews: row.REVIEWS || 0,
      score: row.SCORE || 5,
    }));

    res.json({ 
      success: true, 
      recommendations,
      model: 'content' // Fallback model name
    });
  } catch (error) {
    console.error("Get recommendations error:", error);
    res.status(500).json({ success: false, error: "Failed to fetch recommendations" });
  }
});

// Endpoint to get books by IDs (for enriching recommendations)
app.post("/api/books/by-ids", async (req, res) => {
  try {
    const { ids } = req.body;
    
    if (!ids || !Array.isArray(ids) || ids.length === 0) {
      return res.json({ success: true, books: [] });
    }

    // Create placeholders for IN clause
    const placeholders = ids.map((_, index) => `:id${index}`).join(', ');
    const binds = {};
    ids.forEach((id, index) => {
      binds[`id${index}`] = id;
    });

    const query = `
      SELECT 
        b.isbn as id, 
        b.isbn, 
        b.title, 
        b.price, 
        b.stock_quantity as stock,
        b.pages, 
        b.description, 
        b.image_url as image, 
        b.publication_date as publicationDate,
        a.author_name as author,
        p.publisher_name as publisher,
        c.category_name as categoryName,
        c.category_id,
        NVL((SELECT AVG(rating) FROM reviews WHERE isbn = b.isbn), 0) as rating,
        NVL((SELECT COUNT(*) FROM reviews WHERE isbn = b.isbn), 0) as reviews
      FROM books b
      LEFT JOIN authors a ON b.author_name = a.author_name
      LEFT JOIN publishers p ON b.publisher_name = p.publisher_name
      LEFT JOIN categories c ON b.category_name = c.category_name
      WHERE b.isbn IN (${placeholders})
    `;

    const result = await db.execute(query, binds, {
      outFormat: db.OUT_FORMAT_OBJECT,
      fetchInfo: {
        DESCRIPTION: { type: db.STRING }
      }
    });

    const books = result.rows.map((row) => ({
      id: row.ID,
      isbn: row.ISBN,
      title: row.TITLE,
      price: row.PRICE,
      stock: row.STOCK,
      pages: row.PAGES,
      description: row.DESCRIPTION || '',
      image: row.IMAGE,
      publicationdate: row.PUBLICATIONDATE ? row.PUBLICATIONDATE.toISOString() : null,
      author: row.AUTHOR,
      publisher: row.PUBLISHER,
      categoryname: row.CATEGORYNAME,
      category_id: row.CATEGORY_ID,
      rating: row.RATING || 0,
      reviews: row.REVIEWS || 0,
    }));

    res.json({ success: true, books });
  } catch (error) {
    console.error("Get books by IDs error:", error);
    res.status(500).json({ success: false, error: "Failed to fetch books" });
  }
});

app.get("/api/books", async (req, res) => {
  try {
    const {
      search,
      category,
      author,
      publisher,
      sort = "title",
      page = 1,
      per_page = 20,
    } = req.query;

    let query = `
      SELECT 
        b.isbn as id, 
        b.isbn, 
        b.title, 
        b.price, 
        b.stock_quantity as stock,
        b.pages, 
        b.description, 
        b.image_url as image, 
        b.publication_date as publicationDate,
        a.author_name as author,
        p.publisher_name as publisher,
        c.category_name as categoryName,
        c.category_id,
        NVL((SELECT AVG(rating) FROM reviews WHERE isbn = b.isbn), 0) as rating,
        NVL((SELECT COUNT(*) FROM reviews WHERE isbn = b.isbn), 0) as reviews
      FROM books b
      LEFT JOIN authors a ON b.author_name = a.author_name
      LEFT JOIN publishers p ON b.publisher_name = p.publisher_name
      LEFT JOIN categories c ON b.category_name = c.category_name
      WHERE 1=1
    `;

    const binds = {};
    let bindCount = 1;

    if (search) {
      query += ` AND (LOWER(b.title) LIKE :search${bindCount} OR LOWER(a.author_name) LIKE :search${bindCount})`;
      binds[`search${bindCount}`] = `%${search.toLowerCase()}%`;
      bindCount++;
    }

    if (category && category !== "all") {
      query += ` AND c.category_id = :cat`;
      binds.cat = category;
    }

    if (author) {
      query += ` AND a.author_name = :auth`;
      binds.auth = author;
    }

    if (publisher) {
      query += ` AND p.publisher_name = :pub`;
      binds.pub = publisher;
    }

    // Sorting
    const sortMap = {
      title: "b.title ASC",
      author: "a.author_name ASC",
      publisher: "p.publisher_name ASC",
      "price-low": "b.price ASC",
      "price-high": "b.price DESC",
      newest: "b.publication_date DESC",
    };
    query += ` ORDER BY ${sortMap[sort] || "b.title ASC"}`;

    // Pagination
    const offset = (page - 1) * per_page;
    query += ` OFFSET :offset ROWS FETCH NEXT :limit ROWS ONLY`;
    binds.offset = offset;
    binds.limit = parseInt(per_page);

    const result = await db.execute(query, binds, {
      outFormat: db.OUT_FORMAT_OBJECT,
      fetchInfo: {
        DESCRIPTION: { type: db.STRING },
      },
    });

    // Convert Oracle column names (uppercase) to lowercase
    const books = result.rows.map((row) => ({
      id: row.ID,
      isbn: row.ISBN,
      title: row.TITLE,
      price: row.PRICE,
      stock: row.STOCK,
      pages: row.PAGES,
      description: row.DESCRIPTION || "",
      image: row.IMAGE,
      publicationdate: row.PUBLICATIONDATE
        ? row.PUBLICATIONDATE.toISOString()
        : null,
      author: row.AUTHOR,
      publisher: row.PUBLISHER,
      categoryname: row.CATEGORYNAME,
      category_id: row.CATEGORY_ID,
      rating: row.RATING || 0,
      reviews: row.REVIEWS || 0,
    }));

    res.json({
      success: true,
      books: books,
      pagination: {
        page: parseInt(page),
        per_page: parseInt(per_page),
        total: books.length,
      },
    });
  } catch (error) {
    console.error("Get books error:", error);
    res.status(500).json({ success: false, error: "Failed to fetch books" });
  }
});

// Continue with other routes (categories, cart, orders, etc.)
// Due to length constraints, I'll provide the structure for key routes

// ==================== CATEGORIES ====================

app.get("/api/categories", async (req, res) => {
  try {
    const result = await db.execute(
      "SELECT category_id as id, category_name as name, description FROM categories ORDER BY category_name",
      [],
      { outFormat: db.OUT_FORMAT_OBJECT }
    );

    // Convert Oracle uppercase column names to lowercase
    const dbCategories = result.rows.map((row) => ({
      id: row.ID,
      name: row.NAME,
      description: row.DESCRIPTION,
    }));

    const categories = [
      { id: "all", name: "All Books", description: "All available books" },
      ...dbCategories,
    ];

    res.json({ success: true, categories });
  } catch (error) {
    console.error("Get categories error:", error);
    res
      .status(500)
      .json({ success: false, error: "Failed to fetch categories" });
  }
});

// ==================== FILTERS ====================

// Get filters (authors and publishers)
app.get("/api/filters", async (req, res) => {
  try {
    const authorsResult = await db.execute(
      `SELECT DISTINCT author_name FROM authors ORDER BY author_name`,
      [],
      { outFormat: db.OUT_FORMAT_OBJECT }
    );

    const publishersResult = await db.execute(
      `SELECT DISTINCT publisher_name FROM publishers ORDER BY publisher_name`,
      [],
      { outFormat: db.OUT_FORMAT_OBJECT }
    );

    res.json({
      success: true,
      filters: {
        authors: authorsResult.rows.map((row) => row.AUTHOR_NAME),
        publishers: publishersResult.rows.map((row) => row.PUBLISHER_NAME),
      },
    });
  } catch (error) {
    console.error("Get filters error:", error);
    res.status(500).json({ success: false, error: "Failed to fetch filters" });
  }
});

// ==================== CART ====================

// Get user's cart
app.get("/api/cart", authMiddleware, async (req, res) => {
  try {
    const result = await db.execute(
      `SELECT 
        c.cart_item_id as id,
        c.isbn,
        c.quantity,
        b.title,
        b.price,
        b.image_url as image,
        b.stock_quantity as stock,
        a.author_name as author,
        (c.quantity * b.price) as subtotal
      FROM cart_items c
      JOIN books b ON c.isbn = b.isbn
      LEFT JOIN authors a ON b.author_name = a.author_name
      WHERE c.user_id = :userId
      ORDER BY c.added_at DESC`,
      { userId: req.userId },
      { outFormat: db.OUT_FORMAT_OBJECT }
    );

    res.json({
      success: true,
      cart: result.rows.map((row) => ({
        id: row.ID,
        isbn: row.ISBN,
        quantity: row.QUANTITY,
        title: row.TITLE,
        price: row.PRICE,
        image: row.IMAGE,
        stock: row.STOCK,
        author: row.AUTHOR,
        subtotal: row.SUBTOTAL,
      })),
    });
  } catch (error) {
    console.error("Get cart error:", error);
    res.status(500).json({ success: false, error: "Failed to fetch cart" });
  }
});

// Add to cart
app.post("/api/cart", authMiddleware, async (req, res) => {
  try {
    const { bookId, quantity = 1 } = req.body;

    // Check if item already exists in cart
    const existingItem = await db.execute(
      `SELECT cart_item_id, quantity FROM cart_items WHERE user_id = :userId AND isbn = :isbn`,
      { userId: req.userId, isbn: bookId },
      { outFormat: db.OUT_FORMAT_OBJECT }
    );

    if (existingItem.rows.length > 0) {
      // Update quantity
      const newQuantity = existingItem.rows[0].QUANTITY + quantity;
      await db.execute(
        `UPDATE cart_items SET quantity = :quantity WHERE cart_item_id = :cartItemId`,
        {
          quantity: newQuantity,
          cartItemId: existingItem.rows[0].CART_ITEM_ID,
        },
        { autoCommit: true }
      );
    } else {
      // Insert new item
      await db.execute(
        `INSERT INTO cart_items (user_id, isbn, quantity) VALUES (:userId, :isbn, :quantity)`,
        { userId: req.userId, isbn: bookId, quantity },
        { autoCommit: true }
      );
    }

    res.json({ success: true, message: "Item added to cart" });
  } catch (error) {
    console.error("Add to cart error:", error);
    res.status(500).json({ success: false, error: "Failed to add to cart" });
  }
});

// Update cart item quantity
app.put("/api/cart/:cartItemId", authMiddleware, async (req, res) => {
  try {
    const { cartItemId } = req.params;
    const { quantity } = req.body;

    await db.execute(
      `UPDATE cart_items SET quantity = :quantity WHERE cart_item_id = :cartItemId AND user_id = :userId`,
      { quantity, cartItemId, userId: req.userId },
      { autoCommit: true }
    );

    res.json({ success: true, message: "Cart updated" });
  } catch (error) {
    console.error("Update cart error:", error);
    res.status(500).json({ success: false, error: "Failed to update cart" });
  }
});

// Remove from cart
app.delete("/api/cart/:cartItemId", authMiddleware, async (req, res) => {
  try {
    const { cartItemId } = req.params;

    await db.execute(
      `DELETE FROM cart_items WHERE cart_item_id = :cartItemId AND user_id = :userId`,
      { cartItemId, userId: req.userId },
      { autoCommit: true }
    );

    res.json({ success: true, message: "Item removed from cart" });
  } catch (error) {
    console.error("Remove from cart error:", error);
    res
      .status(500)
      .json({ success: false, error: "Failed to remove from cart" });
  }
});

// ==================== ORDERS ====================

// Create order (checkout)
app.post("/api/orders", authMiddleware, async (req, res) => {
  try {
    const { shippingAddress, paymentMethod } = req.body;

    // Get cart items
    const cartResult = await db.execute(
      `SELECT c.isbn, c.quantity, b.price 
       FROM cart_items c 
       JOIN books b ON c.isbn = b.isbn 
       WHERE c.user_id = :userId`,
      { userId: req.userId },
      { outFormat: db.OUT_FORMAT_OBJECT }
    );

    if (cartResult.rows.length === 0) {
      return res.status(400).json({ success: false, error: "Cart is empty" });
    }

    // Calculate total
    const totalAmount = cartResult.rows.reduce(
      (sum, item) => sum + item.QUANTITY * item.PRICE,
      0
    );

    // Generate order number
    const orderNumber = `ORD-${Date.now()}-${req.userId}`;

    // Insert order
    const orderResult = await db.execute(
      `INSERT INTO orders (user_id, order_number, total_amount, shipping_address, payment_method, payment_status)
       VALUES (:userId, :orderNumber, :totalAmount, :shippingAddress, :paymentMethod, 'pending')
       RETURNING order_id INTO :orderId`,
      {
        userId: req.userId,
        orderNumber,
        totalAmount,
        shippingAddress: shippingAddress || null,
        paymentMethod: paymentMethod || "COD",
        orderId: { dir: db.BIND_OUT, type: db.NUMBER },
      },
      { autoCommit: false }
    );

    const orderId = orderResult.outBinds.orderId;

    // Insert order items
    for (const item of cartResult.rows) {
      await db.execute(
        `INSERT INTO order_items (order_id, isbn, quantity, price_per_item)
         VALUES (:orderId, :isbn, :quantity, :price)`,
        {
          orderId,
          isbn: item.ISBN,
          quantity: item.QUANTITY,
          price: item.PRICE,
        },
        { autoCommit: false }
      );
    }

    // Clear cart
    await db.execute(
      `DELETE FROM cart_items WHERE user_id = :userId`,
      { userId: req.userId },
      { autoCommit: false }
    );

    // Commit transaction
    await db.execute("COMMIT");

    res.json({
      success: true,
      orderId,
      orderNumber,
      totalAmount,
      message: "Order placed successfully",
    });
  } catch (error) {
    console.error("Create order error:", error);
    await db.execute("ROLLBACK");
    res.status(500).json({ success: false, error: "Failed to create order" });
  }
});

// Get user's orders
app.get("/api/orders", authMiddleware, async (req, res) => {
  try {
    const result = await db.execute(
      `SELECT 
        o.order_id as id,
        o.order_number as orderNumber,
        o.total_amount as totalAmount,
        o.payment_status as paymentStatus,
        o.shipping_address as shippingAddress,
        o.created_at as createdAt,
        (SELECT COUNT(*) FROM order_items oi WHERE oi.order_id = o.order_id) as itemCount
      FROM orders o
      WHERE o.user_id = :userId
      ORDER BY o.created_at DESC`,
      { userId: req.userId },
      { outFormat: db.OUT_FORMAT_OBJECT }
    );

    res.json({
      success: true,
      orders: result.rows.map((row) => ({
        id: row.ID,
        orderNumber: row.ORDERNUMBER,
        totalAmount: row.TOTALAMOUNT,
        paymentStatus: row.PAYMENTSTATUS,
        shippingAddress: row.SHIPPINGADDRESS,
        createdAt: row.CREATEDAT ? row.CREATEDAT.toISOString() : null,
        itemCount: row.ITEMCOUNT,
      })),
    });
  } catch (error) {
    console.error("Get orders error:", error);
    res.status(500).json({ success: false, error: "Failed to fetch orders" });
  }
});

// Get order details
app.get("/api/orders/:orderId", authMiddleware, async (req, res) => {
  try {
    const { orderId } = req.params;

    const orderResult = await db.execute(
      `SELECT 
        o.order_id as id,
        o.order_number as orderNumber,
        o.total_amount as totalAmount,
        o.payment_status as paymentStatus,
        o.shipping_address as shippingAddress,
        o.payment_method as paymentMethod,
        o.created_at as createdAt
      FROM orders o
      WHERE o.order_id = :orderId AND o.user_id = :userId`,
      { orderId, userId: req.userId },
      { outFormat: db.OUT_FORMAT_OBJECT }
    );

    if (orderResult.rows.length === 0) {
      return res.status(404).json({ success: false, error: "Order not found" });
    }

    const itemsResult = await db.execute(
      `SELECT 
        oi.isbn,
        oi.quantity,
        oi.price_per_item as price,
        b.title,
        b.image_url as image,
        a.author_name as author
      FROM order_items oi
      JOIN books b ON oi.isbn = b.isbn
      LEFT JOIN authors a ON b.author_name = a.author_name
      WHERE oi.order_id = :orderId`,
      { orderId },
      { outFormat: db.OUT_FORMAT_OBJECT }
    );

    const order = orderResult.rows[0];

    res.json({
      success: true,
      order: {
        id: order.ID,
        orderNumber: order.ORDERNUMBER,
        totalAmount: order.TOTALAMOUNT,
        paymentStatus: order.PAYMENTSTATUS,
        shippingAddress: order.SHIPPINGADDRESS,
        paymentMethod: order.PAYMENTMETHOD,
        createdAt: order.CREATEDAT ? order.CREATEDAT.toISOString() : null,
        items: itemsResult.rows.map((item) => ({
          isbn: item.ISBN,
          quantity: item.QUANTITY,
          price: item.PRICE,
          title: item.TITLE,
          image: item.IMAGE,
          author: item.AUTHOR,
        })),
      },
    });
  } catch (error) {
    console.error("Get order details error:", error);
    res
      .status(500)
      .json({ success: false, error: "Failed to fetch order details" });
  }
});

// ... Continue with CART, ORDERS, and ADMIN routes following similar patterns

// ==================== ADMIN ROUTES ====================

// Admin - Stats
app.get(
  "/api/admin/stats",
  authMiddleware,
  adminMiddleware,
  async (req, res) => {
    try {
      // Get stats
      const statsResult = await db.execute(
        `SELECT 
        (SELECT COUNT(*) FROM users WHERE user_type = 'customer') as total_users,
        (SELECT COUNT(*) FROM books) as total_books,
        (SELECT COUNT(*) FROM orders) as total_orders,
        (SELECT NVL(SUM(total_amount), 0) FROM orders WHERE payment_status = 'completed') as total_revenue,
        (SELECT COUNT(*) FROM orders WHERE payment_status = 'pending') as pending_orders,
        (SELECT COUNT(*) FROM orders WHERE payment_status = 'completed') as completed_orders
      FROM DUAL`,
        {},
        { outFormat: db.OUT_FORMAT_OBJECT }
      );

      // Get recent orders
      const recentOrdersResult = await db.execute(
        `SELECT 
        o.order_id as id,
        o.order_number as orderNumber,
        o.payment_status as status,
        o.total_amount as totalAmount,
        o.created_at as createdAt,
        (SELECT COUNT(*) FROM order_items oi WHERE oi.order_id = o.order_id) as itemsCount
      FROM orders o
      ORDER BY o.created_at DESC
      FETCH FIRST 10 ROWS ONLY`,
        {},
        { outFormat: db.OUT_FORMAT_OBJECT }
      );

      // Get low stock books
      const lowStockResult = await db.execute(
        `SELECT 
        b.isbn as id,
        b.title,
        b.stock_quantity as stock,
        b.image_url as image,
        a.author_name as author
      FROM books b
      LEFT JOIN authors a ON b.author_name = a.author_name
      WHERE b.stock_quantity < 10
      ORDER BY b.stock_quantity ASC
      FETCH FIRST 10 ROWS ONLY`,
        {},
        { outFormat: db.OUT_FORMAT_OBJECT }
      );

      const stats = statsResult.rows[0];

      res.json({
        success: true,
        stats: {
          totalUsers: parseInt(stats.TOTAL_USERS || 0),
          totalBooks: parseInt(stats.TOTAL_BOOKS || 0),
          totalOrders: parseInt(stats.TOTAL_ORDERS || 0),
          totalRevenue: parseFloat(stats.TOTAL_REVENUE || 0),
          pendingOrders: parseInt(stats.PENDING_ORDERS || 0),
          completedOrders: parseInt(stats.COMPLETED_ORDERS || 0),
        },
        recentOrders: recentOrdersResult.rows || [],
        lowStockBooks: lowStockResult.rows || [],
      });
    } catch (error) {
      console.error("Admin stats error:", error);
      res.status(500).json({ success: false, error: "Failed to fetch stats" });
    }
  }
);

function startServer() {
  app.listen(PORT, () => {
    console.log(`✅ E-commerce API server running on port ${PORT}`);
    console.log(`📊 Database: Oracle`);
    console.log(`🔗 Frontend URL: http://localhost:5173`);
  });
}

// Graceful shutdown
process.on("SIGINT", async () => {
  console.log("\n🛑 Shutting down gracefully...");
  await db.close();
  process.exit(0);
});

process.on("SIGTERM", async () => {
  console.log("\n🛑 Shutting down gracefully...");
  await db.close();
  process.exit(0);
});

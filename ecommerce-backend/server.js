// ecommerce-backend/server.js
require("dotenv").config();
console.log("🔍 Environment check:");
console.log("  DATABASE_URL exists:", !!process.env.DATABASE_URL);
console.log("  JWT_SECRET exists:", !!process.env.JWT_SECRET);
console.log("  PORT:", process.env.PORT || "using default");
console.log("  Current directory:", __dirname);
const express = require("express");
const cors = require("cors");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");
const { Pool } = require("pg");

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

// Database connection
const pool = new Pool({
  connectionString:
    process.env.DATABASE_URL ||
    "postgresql://postgres:bookstore123@localhost:5432/bookstore_db",
});

console.log("🔧 Testing database connection...");
console.log(
  "📝 Connection string:",
  process.env.DATABASE_URL || "Using fallback"
);

pool.query("SELECT current_database(), current_user, version()", (err, res) => {
  if (err) {
    console.error("❌ DATABASE CONNECTION FAILED!");
    console.error("❌ Error:", err.message);
    console.error("❌ Code:", err.code);
    console.error("❌ Hint:", err.hint);
  } else {
    console.log("✅ DATABASE CONNECTED SUCCESSFULLY!");
    console.log("📊 Database:", res.rows[0].current_database);
    console.log("👤 User:", res.rows[0].current_user);
    console.log(
      "🐘 PostgreSQL:",
      res.rows[0].version.split(" ")[0],
      res.rows[0].version.split(" ")[1]
    );
  }
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
    const existingUser = await pool.query(
      "SELECT * FROM users WHERE email = $1",
      [email]
    );

    if (existingUser.rows.length > 0) {
      return res
        .status(400)
        .json({ success: false, error: "User already exists" });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Insert user
    const result = await pool.query(
      `INSERT INTO users (first_name, last_name, email, password_hash, phone, user_type)
       VALUES ($1, $2, $3, $4, $5, 'customer')
       RETURNING user_id, first_name, last_name, email, phone, user_type, created_at`,
      [firstName, lastName, email, hashedPassword, phone]
    );

    const user = result.rows[0];

    // Generate token
    const token = jwt.sign(
      { userId: user.user_id, userType: user.user_type },
      JWT_SECRET,
      {
        expiresIn: "7d",
      }
    );

    res.json({
      success: true,
      token,
      user: {
        id: user.user_id,
        firstName: user.first_name,
        lastName: user.last_name,
        email: user.email,
        phone: user.phone,
        user_type: user.user_type,
        joinedDate: user.created_at,
        avatar: `https://ui-avatars.com/api/?name=${user.first_name}+${user.last_name}&background=6366f1&color=fff`,
      },
    });
  } catch (error) {
    console.error("Registration error:", error);
    res.status(500).json({ success: false, error: "Registration failed" });
  }
});

// Login
app.post("/api/auth/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    const result = await pool.query("SELECT * FROM users WHERE email = $1", [
      email,
    ]);

    if (result.rows.length === 0) {
      return res
        .status(401)
        .json({ success: false, error: "Invalid credentials" });
    }

    const user = result.rows[0];
    const validPassword = await bcrypt.compare(password, user.password_hash);

    if (!validPassword) {
      return res
        .status(401)
        .json({ success: false, error: "Invalid credentials" });
    }

    const token = jwt.sign(
      { userId: user.user_id, userType: user.user_type },
      JWT_SECRET,
      {
        expiresIn: "7d",
      }
    );

    res.json({
      success: true,
      token,
      user: {
        id: user.user_id,
        firstName: user.first_name,
        lastName: user.last_name,
        email: user.email,
        phone: user.phone,
        address: user.address,
        city: user.city,
        postalCode: user.postal_code,
        user_type: user.user_type,
        joinedDate: user.created_at,
        avatar: `https://ui-avatars.com/api/?name=${user.first_name}+${user.last_name}&background=6366f1&color=fff`,
      },
    });
  } catch (error) {
    console.error("Login error:", error);
    res.status(500).json({ success: false, error: "Login failed" });
  }
});

// Verify token
app.get("/api/auth/verify", authMiddleware, async (req, res) => {
  try {
    const result = await pool.query("SELECT * FROM users WHERE user_id = $1", [
      req.userId,
    ]);

    if (result.rows.length === 0) {
      return res
        .status(404)
        .json({ success: false, message: "User not found" });
    }

    const user = result.rows[0];
    res.json({
      success: true,
      user: {
        id: user.user_id,
        firstName: user.first_name,
        lastName: user.last_name,
        email: user.email,
        phone: user.phone,
        address: user.address,
        city: user.city,
        postalCode: user.postal_code,
        user_type: user.user_type,
        joinedDate: user.created_at,
        avatar: `https://ui-avatars.com/api/?name=${user.first_name}+${user.last_name}&background=6366f1&color=fff`,
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: "Verification failed" });
  }
});

// ==================== USER PROFILE ====================

app.put("/api/user/profile", authMiddleware, async (req, res) => {
  try {
    const { firstName, lastName, email, phone, address, city, postalCode } =
      req.body;

    const result = await pool.query(
      `UPDATE users SET
        first_name = $1, last_name = $2, email = $3, phone = $4,
        address = $5, city = $6, postal_code = $7
       WHERE user_id = $8
       RETURNING *`,
      [firstName, lastName, email, phone, address, city, postalCode, req.userId]
    );

    const user = result.rows[0];
    res.json({
      success: true,
      user: {
        id: user.user_id,
        firstName: user.first_name,
        lastName: user.last_name,
        email: user.email,
        phone: user.phone,
        address: user.address,
        city: user.city,
        postalCode: user.postal_code,
        user_type: user.user_type,
        joinedDate: user.created_at,
        avatar: `https://ui-avatars.com/api/?name=${user.first_name}+${user.last_name}&background=6366f1&color=fff`,
      },
    });
  } catch (error) {
    console.error("Profile update error:", error);
    res.status(500).json({ success: false, error: "Profile update failed" });
  }
});

// ==================== BOOKS ====================

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
        b.isbn as id, b.isbn, b.title, b.price, b.stock_quantity as stock,
        b.pages, b.description, b.image_url as image, b.publication_date as "publicationDate",
        a.author_name as author,
        p.publisher_name as publisher,
        c.category_name as "categoryName",
        c.category_id
      FROM books b
      LEFT JOIN authors a ON b.author_name = a.author_name
      LEFT JOIN publishers p ON b.publisher_name = p.publisher_name
      LEFT JOIN categories c ON b.category_name = c.category_name
      WHERE 1=1
    `;

    const params = [];
    let paramCount = 1;

    if (search) {
      query += ` AND (b.title ILIKE $${paramCount} OR a.author_name ILIKE $${paramCount})`;
      params.push(`%${search}%`);
      paramCount++;
    }

    if (category && category !== "all") {
      query += ` AND c.category_id = $${paramCount}`;
      params.push(category);
      paramCount++;
    }

    if (author) {
      query += ` AND a.author_name = $${paramCount}`;
      params.push(author);
      paramCount++;
    }

    if (publisher) {
      query += ` AND p.publisher_name = $${paramCount}`;
      params.push(publisher);
      paramCount++;
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
    query += ` LIMIT $${paramCount} OFFSET $${paramCount + 1}`;
    params.push(per_page, offset);

    const result = await pool.query(query, params);

    res.json({
      success: true,
      books: result.rows,
      pagination: {
        page: parseInt(page),
        per_page: parseInt(per_page),
        total: result.rowCount,
      },
    });
  } catch (error) {
    console.error("Get books error:", error);
    res.status(500).json({ success: false, error: "Failed to fetch books" });
  }
});

app.get("/api/books/:id", async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT 
        b.isbn as id, b.isbn, b.title, b.price, b.stock_quantity as stock,
        b.pages, b.description, b.image_url as image, b.publication_date as "publicationDate",
        a.author_name as author,
        p.publisher_name as publisher,
        c.category_name as "categoryName"
      FROM books b
      LEFT JOIN authors a ON b.author_name = a.author_name
      LEFT JOIN publishers p ON b.publisher_name = p.publisher_name
      LEFT JOIN categories c ON b.category_name = c.category_name
      WHERE b.isbn = $1`,
      [req.params.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, error: "Book not found" });
    }

    res.json({ success: true, book: result.rows[0] });
  } catch (error) {
    console.error("Get book error:", error);
    res.status(500).json({ success: false, error: "Failed to fetch book" });
  }
});

// ==================== CATEGORIES ====================

app.get("/api/categories", async (req, res) => {
  console.log("📞 Categories endpoint called");

  try {
    console.log("🔍 Attempting database query...");
    console.log(
      "📊 Database URL:",
      process.env.DATABASE_URL ? "Using .env variable" : "Using fallback"
    );

    const result = await pool.query(
      "SELECT category_id as id, category_name as name, description FROM categories ORDER BY category_name"
    );

    console.log("✅ Query successful! Found", result.rows.length, "categories");

    // Add "All" category at the beginning
    const categories = [
      { id: "all", name: "All Books", description: "All available books" },
      ...result.rows,
    ];

    console.log("📤 Sending response with", categories.length, "categories");
    res.json({ success: true, categories });
  } catch (error) {
    console.error("❌ Get categories error:", error);
    console.error("❌ Error code:", error.code);
    console.error("❌ Error message:", error.message);
    console.error("❌ Error stack:", error.stack);
    res
      .status(500)
      .json({ success: false, error: "Failed to fetch categories" });
  }
});

// ==================== FILTERS ====================

app.get("/api/filters", async (req, res) => {
  try {
    const authors = await pool.query(
      "SELECT DISTINCT author_name FROM authors ORDER BY author_name"
    );
    const publishers = await pool.query(
      "SELECT DISTINCT publisher_name FROM publishers ORDER BY publisher_name"
    );

    res.json({
      success: true,
      filters: {
        authors: authors.rows.map((r) => r.author_name),
        publishers: publishers.rows.map((r) => r.publisher_name),
      },
    });
  } catch (error) {
    console.error("Get filters error:", error);
    res.status(500).json({ success: false, error: "Failed to fetch filters" });
  }
});

// ==================== CART ====================

app.get("/api/cart", authMiddleware, async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT 
        ci.cart_item_id as id,
        ci.quantity,
        b.isbn, b.title, b.price, b.image_url as image,
        a.author_name as author
      FROM cart_items ci
      JOIN books b ON ci.isbn = b.isbn
      LEFT JOIN authors a ON b.author_name = a.author_name
      WHERE ci.user_id = $1`,
      [req.userId]
    );

    res.json({ success: true, cart: result.rows });
  } catch (error) {
    console.error("Get cart error:", error);
    res.status(500).json({ success: false, error: "Failed to fetch cart" });
  }
});

app.post("/api/cart", authMiddleware, async (req, res) => {
  try {
    const { bookId, quantity = 1 } = req.body;

    // Check if item already in cart
    const existing = await pool.query(
      "SELECT * FROM cart_items WHERE user_id = $1 AND isbn = $2",
      [req.userId, bookId]
    );

    if (existing.rows.length > 0) {
      // Update quantity
      await pool.query(
        "UPDATE cart_items SET quantity = quantity + $1 WHERE user_id = $2 AND isbn = $3",
        [quantity, req.userId, bookId]
      );
    } else {
      // Insert new item
      await pool.query(
        "INSERT INTO cart_items (user_id, isbn, quantity) VALUES ($1, $2, $3)",
        [req.userId, bookId, quantity]
      );
    }

    res.json({ success: true, message: "Item added to cart" });
  } catch (error) {
    console.error("Add to cart error:", error);
    res.status(500).json({ success: false, error: "Failed to add to cart" });
  }
});

app.put("/api/cart/:id", authMiddleware, async (req, res) => {
  try {
    const { quantity } = req.body;
    await pool.query(
      "UPDATE cart_items SET quantity = $1 WHERE cart_item_id = $2 AND user_id = $3",
      [quantity, req.params.id, req.userId]
    );
    res.json({ success: true, message: "Cart updated" });
  } catch (error) {
    console.error("Update cart error:", error);
    res.status(500).json({ success: false, error: "Failed to update cart" });
  }
});

app.delete("/api/cart/:id", authMiddleware, async (req, res) => {
  try {
    await pool.query(
      "DELETE FROM cart_items WHERE cart_item_id = $1 AND user_id = $2",
      [req.params.id, req.userId]
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

app.post("/api/orders", authMiddleware, async (req, res) => {
  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    const {
      firstName,
      lastName,
      email,
      phone,
      address,
      city,
      postalCode,
      paymentMethod,
    } = req.body;

    // Get cart items
    const cartItems = await client.query(
      `SELECT ci.*, b.price FROM cart_items ci
       JOIN books b ON ci.isbn = b.isbn
       WHERE ci.user_id = $1`,
      [req.userId]
    );

    if (cartItems.rows.length === 0) {
      throw new Error("Cart is empty");
    }

    // Calculate totals
    const subtotal = cartItems.rows.reduce(
      (sum, item) => sum + item.price * item.quantity,
      0
    );
    const shipping = subtotal > 50 ? 0 : 5.99;
    const tax = subtotal * 0.08;
    const total = subtotal + shipping + tax;

    // Generate order number
    const orderNumber = `ORD-${Date.now()}-${req.userId}`;

    // Create order
    const orderResult = await client.query(
      `INSERT INTO orders (user_id, order_number, total_amount, payment_method, payment_status,
                          shipping_address, shipping_city, shipping_postal_code)
       VALUES ($1, $2, $3, $4, 'pending', $5, $6, $7)
       RETURNING order_id`,
      [req.userId, orderNumber, total, paymentMethod, address, city, postalCode]
    );

    const orderId = orderResult.rows[0].order_id;

    // Create order items
    for (const item of cartItems.rows) {
      await client.query(
        `INSERT INTO order_items (order_id, isbn, quantity, price_per_item)
         VALUES ($1, $2, $3, $4)`,
        [orderId, item.isbn, item.quantity, item.price]
      );
    }

    // Clear cart
    await client.query("DELETE FROM cart_items WHERE user_id = $1", [
      req.userId,
    ]);

    await client.query("COMMIT");

    res.json({
      success: true,
      order: {
        id: orderId,
        orderNumber,
        totalAmount: total,
      },
    });
  } catch (error) {
    await client.query("ROLLBACK");
    console.error("Create order error:", error);
    res.status(500).json({ success: false, error: "Failed to create order" });
  } finally {
    client.release();
  }
});

app.get("/api/orders", authMiddleware, async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT 
        o.order_id as id,
        o.order_number as "orderNumber",
        o.total_amount as "totalAmount",
        o.payment_status as status,
        o.created_at as "createdAt",
        COUNT(oi.order_item_id) as "itemsCount"
      FROM orders o
      LEFT JOIN order_items oi ON o.order_id = oi.order_id
      WHERE o.user_id = $1
      GROUP BY o.order_id
      ORDER BY o.created_at DESC`,
      [req.userId]
    );

    res.json({ success: true, orders: result.rows });
  } catch (error) {
    console.error("Get orders error:", error);
    res.status(500).json({ success: false, error: "Failed to fetch orders" });
  }
});

app.get("/api/orders/:id", authMiddleware, async (req, res) => {
  try {
    const order = await pool.query(
      `SELECT * FROM orders WHERE order_id = $1 AND user_id = $2`,
      [req.params.id, req.userId]
    );

    if (order.rows.length === 0) {
      return res.status(404).json({ success: false, error: "Order not found" });
    }

    const items = await pool.query(
      `SELECT 
        oi.order_item_id as id,
        oi.quantity,
        oi.price_per_item as "pricePerItem",
        (oi.quantity * oi.price_per_item) as "totalPrice",
        b.title, b.image_url as image,
        a.author_name as author
      FROM order_items oi
      JOIN books b ON oi.isbn = b.isbn
      LEFT JOIN authors a ON b.author_name = a.author_name
      WHERE oi.order_id = $1`,
      [req.params.id]
    );

    const orderData = order.rows[0];
    res.json({
      success: true,
      order: {
        id: orderData.order_id,
        orderNumber: orderData.order_number,
        items: items.rows,
        totals: {
          subtotal: orderData.total_amount,
          taxAmount: (orderData.total_amount * 0.08) / 1.08,
          shippingCost: orderData.total_amount > 50 ? 0 : 5.99,
          totalAmount: orderData.total_amount,
        },
        customer: {
          fullName:
            `${orderData.first_name || ""} ${
              orderData.last_name || ""
            }`.trim() || "N/A",
          phone: orderData.phone || "N/A",
          email: orderData.email || "N/A",
        },
        shipping: {
          fullAddress: `${orderData.shipping_address || ""}, ${
            orderData.shipping_city || ""
          } ${orderData.shipping_postal_code || ""}`.trim(),
        },
        payment: {
          status: orderData.payment_status,
        },
      },
    });
  } catch (error) {
    console.error("Get order error:", error);
    res.status(500).json({ success: false, error: "Failed to fetch order" });
  }
});

app.post("/api/orders/:id/cancel", authMiddleware, async (req, res) => {
  try {
    await pool.query(
      `UPDATE orders SET payment_status = 'cancelled' 
       WHERE order_id = $1 AND user_id = $2 AND payment_status = 'pending'`,
      [req.params.id, req.userId]
    );
    res.json({ success: true, message: "Order cancelled" });
  } catch (error) {
    console.error("Cancel order error:", error);
    res.status(500).json({ success: false, error: "Failed to cancel order" });
  }
});

// Start server
app.listen(PORT, () => {
  console.log(`E-commerce API server running on port ${PORT}`);
});

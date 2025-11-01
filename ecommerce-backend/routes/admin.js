// ecommerce-backend/routes/admin.js
// Add these routes to your server.js or create a separate admin routes file

const express = require("express");
const router = express.Router();

// Assuming you have pool and middleware available
// If creating separate file, import them:
// const { pool } = require('../db');
// const { authMiddleware, adminMiddleware } = require('../middleware/auth');

// Apply admin middleware to all routes
router.use(authMiddleware);
router.use(adminMiddleware);

// ==================== ADMIN STATS ====================

router.get("/stats", async (req, res) => {
  try {
    const stats = await pool.query(`
      SELECT 
        (SELECT COUNT(*) FROM users WHERE user_type = 'customer') as total_users,
        (SELECT COUNT(*) FROM books) as total_books,
        (SELECT COUNT(*) FROM orders) as total_orders,
        (SELECT COALESCE(SUM(total_amount), 0) FROM orders WHERE payment_status = 'completed') as total_revenue,
        (SELECT COUNT(*) FROM orders WHERE payment_status = 'pending') as pending_orders,
        (SELECT COUNT(*) FROM orders WHERE payment_status = 'completed') as completed_orders
    `);

    const recentOrders = await pool.query(`
      SELECT 
        o.order_id as id,
        o.order_number as "orderNumber",
        o.payment_status as status,
        o.total_amount as "totalAmount",
        o.created_at as "createdAt",
        COUNT(oi.order_item_id) as "itemsCount"
      FROM orders o
      LEFT JOIN order_items oi ON o.order_id = oi.order_id
      GROUP BY o.order_id
      ORDER BY o.created_at DESC
      LIMIT 10
    `);

    const lowStockBooks = await pool.query(`
      SELECT 
        b.isbn as id,
        b.title,
        b.stock_quantity as stock,
        b.image_url as image,
        a.author_name as author
      FROM books b
      LEFT JOIN authors a ON b.author_name = a.author_name
      WHERE b.stock_quantity < 10
      ORDER BY b.stock_quantity ASC
      LIMIT 10
    `);

    res.json({
      success: true,
      stats: {
        totalUsers: parseInt(stats.rows[0].total_users),
        totalBooks: parseInt(stats.rows[0].total_books),
        totalOrders: parseInt(stats.rows[0].total_orders),
        totalRevenue: parseFloat(stats.rows[0].total_revenue),
        pendingOrders: parseInt(stats.rows[0].pending_orders),
        completedOrders: parseInt(stats.rows[0].completed_orders),
      },
      recentOrders: recentOrders.rows,
      lowStockBooks: lowStockBooks.rows,
    });
  } catch (error) {
    console.error("Admin stats error:", error);
    res.status(500).json({ success: false, error: "Failed to fetch stats" });
  }
});

// ==================== ADMIN BOOKS ====================

router.get("/books", async (req, res) => {
  try {
    const { search, page = 1, per_page = 20 } = req.query;

    let query = `
      SELECT 
        b.isbn, b.title, b.price, b.stock_quantity as stock,
        b.pages, b.description, b.image_url as image,
        b.publication_date as "publicationDate",
        a.author_name as author,
        p.publisher_name as publisher,
        c.category_name as "categoryName"
      FROM books b
      LEFT JOIN authors a ON b.author_name = a.author_name
      LEFT JOIN publishers p ON b.publisher_name = p.publisher_name
      LEFT JOIN categories c ON b.category_name = c.category_name
      WHERE 1=1
    `;

    const params = [];
    let paramCount = 1;

    if (search) {
      query += ` AND (b.title ILIKE $${paramCount} OR b.isbn ILIKE $${paramCount} OR a.author_name ILIKE $${paramCount})`;
      params.push(`%${search}%`);
      paramCount++;
    }

    const countQuery = `SELECT COUNT(*) FROM (${query}) as counted`;
    const countResult = await pool.query(countQuery, params);
    const total = parseInt(countResult.rows[0].count);

    query += ` ORDER BY b.title LIMIT $${paramCount} OFFSET $${paramCount + 1}`;
    const offset = (page - 1) * per_page;
    params.push(per_page, offset);

    const result = await pool.query(query, params);

    res.json({
      success: true,
      books: result.rows,
      pagination: {
        page: parseInt(page),
        per_page: parseInt(per_page),
        pages: Math.ceil(total / per_page),
        total,
      },
    });
  } catch (error) {
    console.error("Admin get books error:", error);
    res.status(500).json({ success: false, error: "Failed to fetch books" });
  }
});

router.post("/books", async (req, res) => {
  try {
    const {
      isbn,
      title,
      author_name,
      publisher_name,
      category_name,
      price,
      stock_quantity,
      pages,
      description,
      image,
      publication_date,
    } = req.body;

    await pool.query(
      `INSERT INTO books (isbn, title, author_name, publisher_name, category_name, 
                         price, stock_quantity, pages, description, image_url, publication_date)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)`,
      [
        isbn,
        title,
        author_name,
        publisher_name,
        category_name,
        price,
        stock_quantity,
        pages,
        description,
        image,
        publication_date,
      ]
    );

    res.json({ success: true, message: "Book created successfully" });
  } catch (error) {
    console.error("Admin create book error:", error);
    res.status(500).json({ success: false, error: "Failed to create book" });
  }
});

router.put("/books/:isbn", async (req, res) => {
  try {
    const { isbn } = req.params;
    const {
      title,
      author_name,
      publisher_name,
      category_name,
      price,
      stock_quantity,
      pages,
      description,
      image,
      publication_date,
    } = req.body;

    await pool.query(
      `UPDATE books SET 
        title = $1, author_name = $2, publisher_name = $3, category_name = $4,
        price = $5, stock_quantity = $6, pages = $7, description = $8,
        image_url = $9, publication_date = $10, updated_at = CURRENT_TIMESTAMP
       WHERE isbn = $11`,
      [
        title,
        author_name,
        publisher_name,
        category_name,
        price,
        stock_quantity,
        pages,
        description,
        image,
        publication_date,
        isbn,
      ]
    );

    res.json({ success: true, message: "Book updated successfully" });
  } catch (error) {
    console.error("Admin update book error:", error);
    res.status(500).json({ success: false, error: "Failed to update book" });
  }
});

router.delete("/books/:isbn", async (req, res) => {
  try {
    await pool.query("DELETE FROM books WHERE isbn = $1", [req.params.isbn]);
    res.json({ success: true, message: "Book deleted successfully" });
  } catch (error) {
    console.error("Admin delete book error:", error);
    res.status(500).json({ success: false, error: "Failed to delete book" });
  }
});

// ==================== ADMIN USERS ====================

router.get("/users", async (req, res) => {
  try {
    const { page = 1, per_page = 20 } = req.query;

    const countResult = await pool.query(
      "SELECT COUNT(*) FROM users WHERE user_type = $1",
      ["customer"]
    );
    const total = parseInt(countResult.rows[0].count);

    const offset = (page - 1) * per_page;
    const result = await pool.query(
      `SELECT 
        user_id as id, first_name as "firstName", last_name as "lastName",
        email, phone, address, city, postal_code as "postalCode",
        user_type, created_at as "joinedDate"
      FROM users
      WHERE user_type = 'customer'
      ORDER BY created_at DESC
      LIMIT $1 OFFSET $2`,
      [per_page, offset]
    );

    const users = result.rows.map((user) => ({
      ...user,
      avatar: `https://ui-avatars.com/api/?name=${user.firstName}+${user.lastName}&background=6366f1&color=fff`,
    }));

    res.json({
      success: true,
      users,
      pagination: {
        page: parseInt(page),
        per_page: parseInt(per_page),
        pages: Math.ceil(total / per_page),
        total,
      },
    });
  } catch (error) {
    console.error("Admin get users error:", error);
    res.status(500).json({ success: false, error: "Failed to fetch users" });
  }
});

router.put("/users/:id", async (req, res) => {
  try {
    const { name, email, phone, address, city, user_type } = req.body;
    const [firstName, ...lastNameParts] = name.split(" ");
    const lastName = lastNameParts.join(" ");

    await pool.query(
      `UPDATE users SET 
        first_name = $1, last_name = $2, email = $3, phone = $4,
        address = $5, city = $6, user_type = $7, updated_at = CURRENT_TIMESTAMP
       WHERE user_id = $8`,
      [
        firstName,
        lastName,
        email,
        phone,
        address,
        city,
        user_type,
        req.params.id,
      ]
    );

    res.json({ success: true, message: "User updated successfully" });
  } catch (error) {
    console.error("Admin update user error:", error);
    res.status(500).json({ success: false, error: "Failed to update user" });
  }
});

router.delete("/users/:id", async (req, res) => {
  try {
    await pool.query("DELETE FROM users WHERE user_id = $1", [req.params.id]);
    res.json({ success: true, message: "User deleted successfully" });
  } catch (error) {
    console.error("Admin delete user error:", error);
    res.status(500).json({ success: false, error: "Failed to delete user" });
  }
});

// ==================== ADMIN ORDERS ====================

router.get("/orders", async (req, res) => {
  try {
    const { status, page = 1, per_page = 20 } = req.query;

    let query = `
      SELECT 
        o.order_id as id,
        o.order_number as "orderNumber",
        o.total_amount as "totalAmount",
        o.payment_status as status,
        o.created_at as "createdAt",
        COUNT(oi.order_item_id) as "itemsCount"
      FROM orders o
      LEFT JOIN order_items oi ON o.order_id = oi.order_id
    `;

    const params = [];
    let paramCount = 1;

    if (status) {
      query += ` WHERE o.payment_status = $${paramCount}`;
      params.push(status);
      paramCount++;
    }

    query += ` GROUP BY o.order_id ORDER BY o.created_at DESC`;

    const countQuery = `SELECT COUNT(*) FROM (${query}) as counted`;
    const countResult = await pool.query(countQuery, params);
    const total = parseInt(countResult.rows[0].count);

    query += ` LIMIT $${paramCount} OFFSET $${paramCount + 1}`;
    const offset = (page - 1) * per_page;
    params.push(per_page, offset);

    const result = await pool.query(query, params);

    res.json({
      success: true,
      orders: result.rows,
      pagination: {
        page: parseInt(page),
        per_page: parseInt(per_page),
        pages: Math.ceil(total / per_page),
        total,
      },
    });
  } catch (error) {
    console.error("Admin get orders error:", error);
    res.status(500).json({ success: false, error: "Failed to fetch orders" });
  }
});

router.get("/orders/:id", async (req, res) => {
  try {
    const order = await pool.query(
      `SELECT o.*, u.first_name, u.last_name, u.email, u.phone
       FROM orders o
       LEFT JOIN users u ON o.user_id = u.user_id
       WHERE o.order_id = $1`,
      [req.params.id]
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
          shippingCost: 5.99,
          totalAmount: orderData.total_amount,
        },
        customer: {
          fullName: `${orderData.first_name || ""} ${
            orderData.last_name || ""
          }`.trim(),
          phone: orderData.phone,
          email: orderData.email,
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
    console.error("Admin get order error:", error);
    res.status(500).json({ success: false, error: "Failed to fetch order" });
  }
});

router.put("/orders/:id", async (req, res) => {
  try {
    const { payment_status } = req.body;
    await pool.query(
      "UPDATE orders SET payment_status = $1, updated_at = CURRENT_TIMESTAMP WHERE order_id = $2",
      [payment_status, req.params.id]
    );
    res.json({ success: true, message: "Order updated successfully" });
  } catch (error) {
    console.error("Admin update order error:", error);
    res.status(500).json({ success: false, error: "Failed to update order" });
  }
});

router.delete("/orders/:id", async (req, res) => {
  try {
    await pool.query("DELETE FROM orders WHERE order_id = $1", [req.params.id]);
    res.json({ success: true, message: "Order deleted successfully" });
  } catch (error) {
    console.error("Admin delete order error:", error);
    res.status(500).json({ success: false, error: "Failed to delete order" });
  }
});

// ==================== ADMIN CATEGORIES ====================

router.get("/categories", async (req, res) => {
  try {
    const result = await pool.query(
      "SELECT category_id as id, category_name as name, description FROM categories ORDER BY category_name"
    );
    res.json({ success: true, categories: result.rows });
  } catch (error) {
    console.error("Admin get categories error:", error);
    res
      .status(500)
      .json({ success: false, error: "Failed to fetch categories" });
  }
});

router.post("/categories", async (req, res) => {
  try {
    const { name, description } = req.body;
    await pool.query(
      "INSERT INTO categories (category_name, description) VALUES ($1, $2)",
      [name, description]
    );
    res.json({ success: true, message: "Category created successfully" });
  } catch (error) {
    console.error("Admin create category error:", error);
    res
      .status(500)
      .json({ success: false, error: "Failed to create category" });
  }
});

router.put("/categories/:name", async (req, res) => {
  try {
    const { description } = req.body;
    await pool.query(
      "UPDATE categories SET description = $1 WHERE category_name = $2",
      [description, req.params.name]
    );
    res.json({ success: true, message: "Category updated successfully" });
  } catch (error) {
    console.error("Admin update category error:", error);
    res
      .status(500)
      .json({ success: false, error: "Failed to update category" });
  }
});

router.delete("/categories/:name", async (req, res) => {
  try {
    await pool.query("DELETE FROM categories WHERE category_name = $1", [
      req.params.name,
    ]);
    res.json({ success: true, message: "Category deleted successfully" });
  } catch (error) {
    console.error("Admin delete category error:", error);
    res
      .status(500)
      .json({ success: false, error: "Failed to delete category" });
  }
});

// Similar routes for Authors, Publishers, and Reviews...
// (I can provide these if needed, but they follow the same pattern)

module.exports = router;

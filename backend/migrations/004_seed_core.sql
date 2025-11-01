-- Seed sample data for Postgres (users, products, and purchase interactions)
-- Run after creating core tables (003_create_core_tables.sql)

-- Users
INSERT INTO users (username, email) VALUES
  ('Parth Jivani','parth@bookhaven.com'),
  ('Nirjari Sheth','nirjari@bookhaven.com'),
  ('John Doe','john.doe@example.com'),
  ('Jane Smith','jane.smith@example.com'),
  ('Bob Wilson','bob.wilson@example.com'),
  ('Alice Johnson','alice.j@example.com');

-- Products
INSERT INTO products (sku, name, category, price) VALUES
  ('9780743273565','The Great Gatsby','Classics',12.99),
  ('9780061120084','To Kill a Mockingbird','Classics',13.99),
  ('9780451524935','1984','Dystopian',13.99),
  ('9780441013593','Dune','Science Fiction',16.99),
  ('9780547928227','The Hobbit','Fantasy',14.99),
  ('9780141439518','Pride and Prejudice','Romance',10.99),
  ('9780307588364','Gone Girl','Thriller',15.99),
  ('9780307949486','The Girl with the Dragon Tattoo','Mystery',16.99),
  ('9780062073501','And Then There Were None','Mystery',11.99),
  ('9781501142970','The Shining','Thriller',14.99)
;

-- Sample purchases (map users by id order from seed)
INSERT INTO user_interactions (user_id, product_id, interaction_type, ts) VALUES
  (2,1,'purchase','2024-09-15 10:30:00'),
  (2,2,'purchase','2024-09-15 10:30:00'),
  (3,3,'purchase','2024-09-20 14:15:00'),
  (3,5,'purchase','2024-09-20 14:15:00'),
  (4,6,'purchase','2024-09-25 16:45:00'),
  (4,9,'purchase','2024-09-25 16:45:00');

-- Refresh materialized view if present
REFRESH MATERIALIZED VIEW CONCURRENTLY mv_user_product_purchases;

-- ecommerce-backend/db/oracle-seed.sql

   SET DEFINE OFF;

-- Insert Categories
insert into categories (
   category_id,
   category_name,
   description
) values ( categories_seq.nextval,
           'Fiction',
           'Literary fiction and novels' );

insert into categories (
   category_id,
   category_name,
   description
) values ( categories_seq.nextval,
           'Classics',
           'Classic literature and timeless books' );

insert into categories (
   category_id,
   category_name,
   description
) values ( categories_seq.nextval,
           'Dystopian',
           'Dystopian and post-apocalyptic fiction' );

insert into categories (
   category_id,
   category_name,
   description
) values ( categories_seq.nextval,
           'Science Fiction',
           'Science fiction and futuristic stories' );

insert into categories (
   category_id,
   category_name,
   description
) values ( categories_seq.nextval,
           'Fantasy',
           'Fantasy and magical worlds' );

insert into categories (
   category_id,
   category_name,
   description
) values ( categories_seq.nextval,
           'Romance',
           'Romantic fiction' );

insert into categories (
   category_id,
   category_name,
   description
) values ( categories_seq.nextval,
           'Thriller',
           'Thriller and suspense novels' );

insert into categories (
   category_id,
   category_name,
   description
) values ( categories_seq.nextval,
           'Mystery',
           'Mystery and detective stories' );

-- Insert Authors
insert into authors (
   author_id,
   author_name,
   nationality,
   biography
) values ( authors_seq.nextval,
           'F. Scott Fitzgerald',
           'American',
           'American novelist and short story writer' );

insert into authors (
   author_id,
   author_name,
   nationality,
   biography
) values ( authors_seq.nextval,
           'Harper Lee',
           'American',
           'American novelist known for To Kill a Mockingbird' );

insert into authors (
   author_id,
   author_name,
   nationality,
   biography
) values ( authors_seq.nextval,
           'George Orwell',
           'British',
           'English novelist and essayist' );

insert into authors (
   author_id,
   author_name,
   nationality,
   biography
) values ( authors_seq.nextval,
           'Frank Herbert',
           'American',
           'American science fiction author' );

insert into authors (
   author_id,
   author_name,
   nationality,
   biography
) values ( authors_seq.nextval,
           'J.R.R. Tolkien',
           'British',
           'English writer, poet, and academic' );

insert into authors (
   author_id,
   author_name,
   nationality,
   biography
) values ( authors_seq.nextval,
           'Jane Austen',
           'British',
           'English novelist known for social commentary' );

insert into authors (
   author_id,
   author_name,
   nationality,
   biography
) values ( authors_seq.nextval,
           'Gillian Flynn',
           'American',
           'American writer and former television critic' );

insert into authors (
   author_id,
   author_name,
   nationality,
   biography
) values ( authors_seq.nextval,
           'Stieg Larsson',
           'Swedish',
           'Swedish writer and journalist' );

insert into authors (
   author_id,
   author_name,
   nationality,
   biography
) values ( authors_seq.nextval,
           'Agatha Christie',
           'British',
           'English writer known for detective novels' );

insert into authors (
   author_id,
   author_name,
   nationality,
   biography
) values ( authors_seq.nextval,
           'Stephen King',
           'American',
           'American author of horror and suspense novels' );

-- Insert Publishers (with escaped ampersands)
insert into publishers (
   publisher_id,
   publisher_name,
   address,
   city,
   phone,
   email,
   established_date
) values ( publishers_seq.nextval,
           'Scribner',
           '1230 Avenue of the Americas',
           'New York',
           '212-698-7000',
           'info@scribner.com',
           to_date('1846-01-01','YYYY-MM-DD') );

insert into publishers (
   publisher_id,
   publisher_name,
   address,
   city,
   phone,
   email,
   established_date
) values ( publishers_seq.nextval,
           'J. B. Lippincott and Co.',
           '227 South 6th Street',
           'Philadelphia',
           '215-574-4200',
           'contact@lippincott.com',
           to_date('1836-01-01','YYYY-MM-DD') );

insert into publishers (
   publisher_id,
   publisher_name,
   address,
   city,
   phone,
   email,
   established_date
) values ( publishers_seq.nextval,
           'Secker and Warburg',
           '20 Vauxhall Bridge Rd',
           'London',
           '+44-20-7840-8400',
           'info@secker.co.uk',
           to_date('1935-01-01','YYYY-MM-DD') );

insert into publishers (
   publisher_id,
   publisher_name,
   address,
   city,
   phone,
   email,
   established_date
) values ( publishers_seq.nextval,
           'Chilton Books',
           '201 King of Prussia Rd',
           'Philadelphia',
           '215-964-4000',
           'orders@chilton.com',
           to_date('1904-01-01','YYYY-MM-DD') );

insert into publishers (
   publisher_id,
   publisher_name,
   address,
   city,
   phone,
   email,
   established_date
) values ( publishers_seq.nextval,
           'Allen and Unwin',
           '406 Albert St',
           'London',
           '+44-20-7837-4000',
           'info@allenunwin.co.uk',
           to_date('1914-01-01','YYYY-MM-DD') );

insert into publishers (
   publisher_id,
   publisher_name,
   address,
   city,
   phone,
   email,
   established_date
) values ( publishers_seq.nextval,
           'T. Egerton',
           '25 Whitehall',
           'London',
           '+44-20-7930-4830',
           'admin@egerton.co.uk',
           to_date('1780-01-01','YYYY-MM-DD') );

insert into publishers (
   publisher_id,
   publisher_name,
   address,
   city,
   phone,
   email,
   established_date
) values ( publishers_seq.nextval,
           'Crown Publishing',
           '1745 Broadway',
           'New York',
           '212-782-9000',
           'publicity@crownpublishing.com',
           to_date('1933-01-01','YYYY-MM-DD') );

insert into publishers (
   publisher_id,
   publisher_name,
   address,
   city,
   phone,
   email,
   established_date
) values ( publishers_seq.nextval,
           'Norstedts Förlag',
           'Tryckerigatan 4',
           'Stockholm',
           '+46-8-769-8800',
           'kundtjanst@norstedts.se',
           to_date('1823-01-01','YYYY-MM-DD') );

insert into publishers (
   publisher_id,
   publisher_name,
   address,
   city,
   phone,
   email,
   established_date
) values ( publishers_seq.nextval,
           'Collins Crime Club',
           '1 London Bridge Street',
           'London',
           '+44-20-8741-7070',
           'enquiries@collins.co.uk',
           to_date('1930-01-01','YYYY-MM-DD') );

insert into publishers (
   publisher_id,
   publisher_name,
   address,
   city,
   phone,
   email,
   established_date
) values ( publishers_seq.nextval,
           'Doubleday',
           '1745 Broadway',
           'New York',
           '212-782-9000',
           'info@doubleday.com',
           to_date('1897-01-01','YYYY-MM-DD') );

-- Insert Books
insert into books (
   isbn,
   title,
   author_name,
   publisher_name,
   category_name,
   price,
   stock_quantity,
   pages,
   description,
   image_url,
   publication_date
) values ( '9780743273565',
           'The Great Gatsby',
           'F. Scott Fitzgerald',
           'Scribner',
           'Classics',
           12.99,
           25,
           180,
           'A classic novel of the Jazz Age',
           'https://images-na.ssl-images-amazon.com/images/I/81QuEGw8VPL.jpg',
           to_date('1925-04-10','YYYY-MM-DD') );

insert into books (
   isbn,
   title,
   author_name,
   publisher_name,
   category_name,
   price,
   stock_quantity,
   pages,
   description,
   image_url,
   publication_date
) values ( '9780061120084',
           'To Kill a Mockingbird',
           'Harper Lee',
           'J. B. Lippincott and Co.',
           'Classics',
           13.99,
           30,
           324,
           'A gripping tale of racial injustice and childhood innocence',
           'https://images-na.ssl-images-amazon.com/images/I/71FxgtFKcQL.jpg',
           to_date('1960-07-11','YYYY-MM-DD') );

insert into books (
   isbn,
   title,
   author_name,
   publisher_name,
   category_name,
   price,
   stock_quantity,
   pages,
   description,
   image_url,
   publication_date
) values ( '9780451524935',
           '1984',
           'George Orwell',
           'Secker and Warburg',
           'Dystopian',
           13.99,
           20,
           328,
           'A dystopian social science fiction novel',
           'https://images-na.ssl-images-amazon.com/images/I/71kxa1-0mfL.jpg',
           to_date('1949-06-08','YYYY-MM-DD') );

insert into books (
   isbn,
   title,
   author_name,
   publisher_name,
   category_name,
   price,
   stock_quantity,
   pages,
   description,
   image_url,
   publication_date
) values ( '9780441013593',
           'Dune',
           'Frank Herbert',
           'Chilton Books',
           'Science Fiction',
           16.99,
           15,
           688,
           'A science fiction masterpiece set on the desert planet Arrakis',
           'https://images-na.ssl-images-amazon.com/images/I/81ym3zu2iCL.jpg',
           to_date('1965-06-01','YYYY-MM-DD') );

insert into books (
   isbn,
   title,
   author_name,
   publisher_name,
   category_name,
   price,
   stock_quantity,
   pages,
   description,
   image_url,
   publication_date
) values ( '9780547928227',
           'The Hobbit',
           'J.R.R. Tolkien',
           'Allen and Unwin',
           'Fantasy',
           14.99,
           22,
           310,
           'A fantasy adventure about Bilbo Baggins',
           'https://images-na.ssl-images-amazon.com/images/I/71V2v2GtAtL.jpg',
           to_date('1937-09-21','YYYY-MM-DD') );

insert into books (
   isbn,
   title,
   author_name,
   publisher_name,
   category_name,
   price,
   stock_quantity,
   pages,
   description,
   image_url,
   publication_date
) values ( '9780141439518',
           'Pride and Prejudice',
           'Jane Austen',
           'T. Egerton',
           'Romance',
           10.99,
           28,
           432,
           'A romantic novel of manners',
           'https://images-na.ssl-images-amazon.com/images/I/71Q1tPupKjL.jpg',
           to_date('1813-01-28','YYYY-MM-DD') );

insert into books (
   isbn,
   title,
   author_name,
   publisher_name,
   category_name,
   price,
   stock_quantity,
   pages,
   description,
   image_url,
   publication_date
) values ( '9780307588364',
           'Gone Girl',
           'Gillian Flynn',
           'Crown Publishing',
           'Thriller',
           15.99,
           18,
           432,
           'A psychological thriller about a missing wife',
           'https://images-na.ssl-images-amazon.com/images/I/81a5KHEkwQL.jpg',
           to_date('2012-06-05','YYYY-MM-DD') );

insert into books (
   isbn,
   title,
   author_name,
   publisher_name,
   category_name,
   price,
   stock_quantity,
   pages,
   description,
   image_url,
   publication_date
) values ( '9780307949486',
           'The Girl with the Dragon Tattoo',
           'Stieg Larsson',
           'Norstedts Förlag',
           'Mystery',
           16.99,
           16,
           465,
           'A mystery thriller set in Sweden',
           'https://images-na.ssl-images-amazon.com/images/I/71V1HV8zpTL.jpg',
           to_date('2005-08-01','YYYY-MM-DD') );

insert into books (
   isbn,
   title,
   author_name,
   publisher_name,
   category_name,
   price,
   stock_quantity,
   pages,
   description,
   image_url,
   publication_date
) values ( '9780062073501',
           'And Then There Were None',
           'Agatha Christie',
           'Collins Crime Club',
           'Mystery',
           11.99,
           24,
           272,
           'A classic mystery novel',
           'https://images-na.ssl-images-amazon.com/images/I/71a0JE0a6rL.jpg',
           to_date('1939-11-06','YYYY-MM-DD') );

insert into books (
   isbn,
   title,
   author_name,
   publisher_name,
   category_name,
   price,
   stock_quantity,
   pages,
   description,
   image_url,
   publication_date
) values ( '9781501142970',
           'The Shining',
           'Stephen King',
           'Doubleday',
           'Thriller',
           14.99,
           19,
           447,
           'A horror novel about an isolated hotel',
           'https://images-na.ssl-images-amazon.com/images/I/91U7HNa2NQL.jpg',
           to_date('1977-01-28','YYYY-MM-DD') );

-- Insert Users (password is 'Password123!' hashed with bcrypt)
insert into users (
   user_id,
   first_name,
   last_name,
   email,
   password_hash,
   phone,
   address,
   city,
   postal_code,
   user_type
) values ( users_seq.nextval,
           'Parth',
           'Jivani',
           'parth@bookhaven.com',
           '$2a$10$xyz...hashedpassword',
           '555-0101',
           '123 Main St',
           'New York',
           '10001',
           'admin' );

insert into users (
   user_id,
   first_name,
   last_name,
   email,
   password_hash,
   phone,
   address,
   city,
   postal_code,
   user_type
) values ( users_seq.nextval,
           'Nirjari',
           'Sheth',
           'nirjari@bookhaven.com',
           '$2a$10$xyz...hashedpassword',
           '555-0102',
           '456 Oak Ave',
           'Boston',
           '02108',
           'customer' );

insert into users (
   user_id,
   first_name,
   last_name,
   email,
   password_hash,
   phone,
   address,
   city,
   postal_code,
   user_type
) values ( users_seq.nextval,
           'John',
           'Doe',
           'john.doe@example.com',
           '$2a$10$xyz...hashedpassword',
           '555-0103',
           '789 Pine St',
           'Chicago',
           '60601',
           'customer' );

insert into users (
   user_id,
   first_name,
   last_name,
   email,
   password_hash,
   phone,
   address,
   city,
   postal_code,
   user_type
) values ( users_seq.nextval,
           'Jane',
           'Smith',
           'jane.smith@example.com',
           '$2a$10$xyz...hashedpassword',
           '555-0104',
           '321 Elm St',
           'Los Angeles',
           '90001',
           'customer' );

insert into users (
   user_id,
   first_name,
   last_name,
   email,
   password_hash,
   phone,
   address,
   city,
   postal_code,
   user_type
) values ( users_seq.nextval,
           'Bob',
           'Wilson',
           'bob.wilson@example.com',
           '$2a$10$xyz...hashedpassword',
           '555-0105',
           '654 Maple Dr',
           'Seattle',
           '98101',
           'customer' );

insert into users (
   user_id,
   first_name,
   last_name,
   email,
   password_hash,
   phone,
   address,
   city,
   postal_code,
   user_type
) values ( users_seq.nextval,
           'Alice',
           'Johnson',
           'alice.j@example.com',
           '$2a$10$xyz...hashedpassword',
           '555-0106',
           '987 Cedar Ln',
           'Miami',
           '33101',
           'customer' );

-- Insert Recommendation Models
insert into recommendation_models (
   model_id,
   model_name,
   is_active
) values ( recommendation_models_seq.nextval,
           'collaborative',
           1 );

insert into recommendation_models (
   model_id,
   model_name,
   is_active
) values ( recommendation_models_seq.nextval,
           'content',
           1 );

insert into recommendation_models (
   model_id,
   model_name,
   is_active
) values ( recommendation_models_seq.nextval,
           'graph',
           1 );

-- Insert User Model Assignments
insert into user_model_assignments (
   user_id,
   model_id
) values ( 2,
           1 );

insert into user_model_assignments (
   user_id,
   model_id
) values ( 3,
           2 );

insert into user_model_assignments (
   user_id,
   model_id
) values ( 4,
           1 );

insert into user_model_assignments (
   user_id,
   model_id
) values ( 5,
           3 );

insert into user_model_assignments (
   user_id,
   model_id
) values ( 6,
           2 );

-- Insert some sample user interactions
insert into user_interactions (
   interaction_id,
   user_id,
   isbn,
   interaction_type
) values ( user_interactions_seq.nextval,
           2,
           '9780743273565',
           'purchase' );

insert into user_interactions (
   interaction_id,
   user_id,
   isbn,
   interaction_type
) values ( user_interactions_seq.nextval,
           2,
           '9780061120084',
           'purchase' );

insert into user_interactions (
   interaction_id,
   user_id,
   isbn,
   interaction_type
) values ( user_interactions_seq.nextval,
           3,
           '9780451524935',
           'purchase' );

insert into user_interactions (
   interaction_id,
   user_id,
   isbn,
   interaction_type
) values ( user_interactions_seq.nextval,
           3,
           '9780547928227',
           'purchase' );

insert into user_interactions (
   interaction_id,
   user_id,
   isbn,
   interaction_type
) values ( user_interactions_seq.nextval,
           4,
           '9780141439518',
           'purchase' );

insert into user_interactions (
   interaction_id,
   user_id,
   isbn,
   interaction_type
) values ( user_interactions_seq.nextval,
           4,
           '9780062073501',
           'purchase' );

insert into user_interactions (
   interaction_id,
   user_id,
   isbn,
   interaction_type
) values ( user_interactions_seq.nextval,
           5,
           '9780307588364',
           'view' );

insert into user_interactions (
   interaction_id,
   user_id,
   isbn,
   interaction_type
) values ( user_interactions_seq.nextval,
           6,
           '9781501142970',
           'cart_add' );

-- Insert some reviews
insert into reviews (
   review_id,
   user_id,
   isbn,
   rating,
   review_text
) values ( reviews_seq.nextval,
           2,
           '9780743273565',
           5,
           'Absolutely brilliant! Fitzgerald captures the essence of the Jazz Age perfectly.' );

insert into reviews (
   review_id,
   user_id,
   isbn,
   rating,
   review_text
) values ( reviews_seq.nextval,
           3,
           '9780451524935',
           4,
           'Chilling and thought-provoking. Orwell was ahead of his time.' );

insert into reviews (
   review_id,
   user_id,
   isbn,
   rating,
   review_text
) values ( reviews_seq.nextval,
           4,
           '9780141439518',
           5,
           'A timeless classic that never gets old. Austen wit is unmatched.' );

insert into reviews (
   review_id,
   user_id,
   isbn,
   rating,
   review_text
) values ( reviews_seq.nextval,
           5,
           '9780307588364',
           4,
           'Kept me on the edge of my seat! The plot twists are incredible.' );

-- Insert cart items
insert into cart_items (
   cart_item_id,
   user_id,
   isbn,
   quantity
) values ( cart_items_seq.nextval,
           3,
           '9780441013593',
           1 );

insert into cart_items (
   cart_item_id,
   user_id,
   isbn,
   quantity
) values ( cart_items_seq.nextval,
           4,
           '9780307949486',
           2 );

insert into cart_items (
   cart_item_id,
   user_id,
   isbn,
   quantity
) values ( cart_items_seq.nextval,
           5,
           '9781501142970',
           1 );

-- Insert recommendation events
insert into recommendation_events (
   event_id,
   user_id,
   isbn,
   model_id,
   event_type,
   metadata
) values ( recommendation_events_seq.nextval,
           2,
           '9780451524935',
           1,
           'recommendation_shown',
           '{"position": 1, "source": "user_history"}' );

insert into recommendation_events (
   event_id,
   user_id,
   isbn,
   model_id,
   event_type,
   metadata
) values ( recommendation_events_seq.nextval,
           3,
           '9780743273565',
           2,
           'recommendation_shown',
           '{"position": 2, "source": "similar_users"}' );

insert into recommendation_events (
   event_id,
   user_id,
   isbn,
   model_id,
   event_type,
   metadata
) values ( recommendation_events_seq.nextval,
           4,
           '9780062073501',
           1,
           'recommendation_clicked',
           '{"position": 3, "source": "category_based"}' );

commit;
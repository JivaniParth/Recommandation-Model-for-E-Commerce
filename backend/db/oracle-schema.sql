-- ecommerce-backend/db/oracle-schema-bookstore.sql
-- Connect as BOOKSTORE user to run this

-- Drop tables if they exist (in reverse order of dependencies)
begin
   execute immediate 'DROP TABLE recommendation_events CASCADE CONSTRAINTS';
exception
   when others then
      null;
end;
/

begin
   execute immediate 'DROP TABLE user_model_assignments CASCADE CONSTRAINTS';
exception
   when others then
      null;
end;
/

begin
   execute immediate 'DROP TABLE recommendation_models CASCADE CONSTRAINTS';
exception
   when others then
      null;
end;
/

begin
   execute immediate 'DROP TABLE user_interactions CASCADE CONSTRAINTS';
exception
   when others then
      null;
end;
/

begin
   execute immediate 'DROP TABLE order_items CASCADE CONSTRAINTS';
exception
   when others then
      null;
end;
/

begin
   execute immediate 'DROP TABLE orders CASCADE CONSTRAINTS';
exception
   when others then
      null;
end;
/

begin
   execute immediate 'DROP TABLE cart_items CASCADE CONSTRAINTS';
exception
   when others then
      null;
end;
/

begin
   execute immediate 'DROP TABLE reviews CASCADE CONSTRAINTS';
exception
   when others then
      null;
end;
/

begin
   execute immediate 'DROP TABLE books CASCADE CONSTRAINTS';
exception
   when others then
      null;
end;
/

begin
   execute immediate 'DROP TABLE authors CASCADE CONSTRAINTS';
exception
   when others then
      null;
end;
/

begin
   execute immediate 'DROP TABLE publishers CASCADE CONSTRAINTS';
exception
   when others then
      null;
end;
/

begin
   execute immediate 'DROP TABLE categories CASCADE CONSTRAINTS';
exception
   when others then
      null;
end;
/

begin
   execute immediate 'DROP TABLE users CASCADE CONSTRAINTS';
exception
   when others then
      null;
end;
/

-- Drop sequences
begin
   execute immediate 'DROP SEQUENCE users_seq';
exception
   when others then
      null;
end;
/

begin
   execute immediate 'DROP SEQUENCE categories_seq';
exception
   when others then
      null;
end;
/

begin
   execute immediate 'DROP SEQUENCE authors_seq';
exception
   when others then
      null;
end;
/

begin
   execute immediate 'DROP SEQUENCE publishers_seq';
exception
   when others then
      null;
end;
/

begin
   execute immediate 'DROP SEQUENCE cart_items_seq';
exception
   when others then
      null;
end;
/

begin
   execute immediate 'DROP SEQUENCE orders_seq';
exception
   when others then
      null;
end;
/

begin
   execute immediate 'DROP SEQUENCE order_items_seq';
exception
   when others then
      null;
end;
/

begin
   execute immediate 'DROP SEQUENCE reviews_seq';
exception
   when others then
      null;
end;
/

begin
   execute immediate 'DROP SEQUENCE user_interactions_seq';
exception
   when others then
      null;
end;
/

begin
   execute immediate 'DROP SEQUENCE recommendation_models_seq';
exception
   when others then
      null;
end;
/

begin
   execute immediate 'DROP SEQUENCE recommendation_events_seq';
exception
   when others then
      null;
end;
/

-- Create sequences
create sequence users_seq start with 1 increment by 1;
create sequence categories_seq start with 1 increment by 1;
create sequence authors_seq start with 1 increment by 1;
create sequence publishers_seq start with 1 increment by 1;
create sequence cart_items_seq start with 1 increment by 1;
create sequence orders_seq start with 1 increment by 1;
create sequence order_items_seq start with 1 increment by 1;
create sequence reviews_seq start with 1 increment by 1;
create sequence user_interactions_seq start with 1 increment by 1;
create sequence recommendation_models_seq start with 1 increment by 1;
create sequence recommendation_events_seq start with 1 increment by 1;

-- Users table
create table users (
   user_id       number primary key,
   first_name    varchar2(100),
   last_name     varchar2(100),
   email         varchar2(320) unique not null,
   password_hash varchar2(255) not null,
   phone         varchar2(20),
   address       varchar2(500),
   city          varchar2(100),
   postal_code   varchar2(20),
   user_type     varchar2(20) default 'customer',
   created_at    timestamp default current_timestamp,
   updated_at    timestamp default current_timestamp
);

-- Categories table
create table categories (
   category_id   number primary key,
   category_name varchar2(100) unique not null,
   description   varchar2(500)
);

-- Authors table
create table authors (
   author_id   number primary key,
   author_name varchar2(200) unique not null,
   biography   clob,
   nationality varchar2(100)
);

-- Publishers table
create table publishers (
   publisher_id     number primary key,
   publisher_name   varchar2(200) unique not null,
   address          varchar2(500),
   city             varchar2(100),
   phone            varchar2(20),
   email            varchar2(320),
   established_date date
);

-- Books table
create table books (
   isbn             varchar2(20) primary key,
   title            varchar2(400) not null,
   author_name      varchar2(200),
   publisher_name   varchar2(200),
   category_name    varchar2(100),
   price            number(10,2) not null,
   stock_quantity   number default 0,
   pages            number,
   description      clob,
   image_url        varchar2(500),
   publication_date date,
   created_at       timestamp default current_timestamp,
   updated_at       timestamp default current_timestamp,
   constraint fk_books_author foreign key ( author_name )
      references authors ( author_name )
         on delete set null,
   constraint fk_books_publisher foreign key ( publisher_name )
      references publishers ( publisher_name )
         on delete set null,
   constraint fk_books_category foreign key ( category_name )
      references categories ( category_name )
         on delete set null
);

-- Cart items table
create table cart_items (
   cart_item_id number primary key,
   user_id      number not null,
   isbn         varchar2(20) not null,
   quantity     number default 1,
   added_at     timestamp default current_timestamp,
   constraint fk_cart_user foreign key ( user_id )
      references users ( user_id )
         on delete cascade,
   constraint fk_cart_book foreign key ( isbn )
      references books ( isbn )
         on delete cascade
);

-- Orders table
create table orders (
   order_id             number primary key,
   user_id              number not null,
   order_number         varchar2(50) unique not null,
   total_amount         number(10,2) not null,
   payment_method       varchar2(50),
   payment_status       varchar2(20) default 'pending',
   shipping_address     varchar2(500),
   shipping_city        varchar2(100),
   shipping_postal_code varchar2(20),
   created_at           timestamp default current_timestamp,
   updated_at           timestamp default current_timestamp,
   constraint fk_orders_user foreign key ( user_id )
      references users ( user_id )
         on delete cascade
);

-- Order items table
create table order_items (
   order_item_id  number primary key,
   order_id       number not null,
   isbn           varchar2(20) not null,
   quantity       number not null,
   price_per_item number(10,2) not null,
   constraint fk_order_items_order foreign key ( order_id )
      references orders ( order_id )
         on delete cascade,
   constraint fk_order_items_book foreign key ( isbn )
      references books ( isbn )
         on delete cascade
);

-- Reviews table
create table reviews (
   review_id   number primary key,
   user_id     number not null,
   isbn        varchar2(20) not null,
   rating      number check ( rating between 1 and 5 ),
   review_text clob,
   review_date timestamp default current_timestamp,
   constraint fk_reviews_user foreign key ( user_id )
      references users ( user_id )
         on delete cascade,
   constraint fk_reviews_book foreign key ( isbn )
      references books ( isbn )
         on delete cascade
);

-- User interactions table (for recommendation system)
create table user_interactions (
   interaction_id        number primary key,
   user_id               number not null,
   isbn                  varchar2(20) not null,
   interaction_type      varchar2(20), -- 'view', 'cart_add', 'purchase'
   interaction_timestamp timestamp default current_timestamp,
   constraint fk_interactions_user foreign key ( user_id )
      references users ( user_id )
         on delete cascade,
   constraint fk_interactions_book foreign key ( isbn )
      references books ( isbn )
         on delete cascade
);

-- Recommendation models table
create table recommendation_models (
   model_id   number primary key,
   model_name varchar2(100) not null,
   is_active  number(1) default 1
);

-- User model assignments table
create table user_model_assignments (
   user_id     number primary key,
   model_id    number,
   assigned_at timestamp default current_timestamp,
   constraint fk_assignment_user foreign key ( user_id )
      references users ( user_id )
         on delete cascade,
   constraint fk_assignment_model foreign key ( model_id )
      references recommendation_models ( model_id )
         on delete cascade
);

-- Recommendation events table
create table recommendation_events (
   event_id   number primary key,
   user_id    number,
   isbn       varchar2(20),
   model_id   number,
   event_type varchar2(50) not null,
   metadata   clob,
   created_at timestamp default current_timestamp,
   constraint fk_events_model foreign key ( model_id )
      references recommendation_models ( model_id )
         on delete set null
);

-- Create indexes
create index idx_books_author on
   books (
      author_name
   );
create index idx_books_category on
   books (
      category_name
   );
create index idx_cart_user on
   cart_items (
      user_id
   );
create index idx_orders_user on
   orders (
      user_id
   );
create index idx_order_items_order on
   order_items (
      order_id
   );
create index idx_reviews_user on
   reviews (
      user_id
   );
create index idx_reviews_book on
   reviews (
      isbn
   );
create index idx_interactions_user on
   user_interactions (
      user_id
   );
create index idx_interactions_book on
   user_interactions (
      isbn
   );
create index idx_events_user on
   recommendation_events (
      user_id
   );
create index idx_events_model on
   recommendation_events (
      model_id
   );

-- Triggers for auto-incrementing primary keys
create or replace trigger users_bi before
   insert on users
   for each row
begin
   if :new.user_id is null then
      select users_seq.nextval
        into :new.user_id
        from dual;
   end if;
end;
/

-- ... (include all the other triggers from your original file)
-- Update timestamp triggers
create or replace trigger users_bu before
   update on users
   for each row
begin
   :new.updated_at := current_timestamp;
end;
/

create or replace trigger books_bu before
   update on books
   for each row
begin
   :new.updated_at := current_timestamp;
end;
/

create or replace trigger orders_bu before
   update on orders
   for each row
begin
   :new.updated_at := current_timestamp;
end;
/

commit;
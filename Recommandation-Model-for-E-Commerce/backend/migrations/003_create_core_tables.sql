-- Create core tables for Postgres: users, products, user_interactions
-- Run this against your Postgres database (psql or migration tool)

create table if not exists users (
   id         serial primary key,
   username   varchar(200),
   email      varchar(320),
   created_at timestamp default now()
);

create table if not exists products (
   id       serial primary key,
   sku      varchar(64),
   name     varchar(400),
   category varchar(200),
   price    numeric(10,2)
);

create table if not exists user_interactions (
   id               serial primary key,
   user_id          integer
      references users ( id ),
   product_id       integer
      references products ( id ),
   interaction_type varchar(20), -- 'view','cart_add','purchase'
   ts               timestamp default now()
);

-- Optional materialized view for purchase co-occurrence (refresh manually)
create materialized view if not exists mv_user_product_purchases as
   select ui.user_id,
          ui.product_id,
          count(*) as purchase_count
     from user_interactions ui
    where ui.interaction_type = 'purchase'
    group by ui.user_id,
             ui.product_id;

-- Indexes
create index if not exists idx_ui_user on
   user_interactions (
      user_id
   );
create index if not exists idx_ui_product on
   user_interactions (
      product_id
   );
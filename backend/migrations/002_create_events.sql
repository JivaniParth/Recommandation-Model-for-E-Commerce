-- Migration: create recommendation_events table for logging impressions/clicks

create table if not exists recommendation_events (
   id         serial primary key,
   user_id    integer,
   product_id integer,
   model_id   integer
      references recommendation_models ( id ),
   event_type varchar(50) not null, -- e.g., 'impression', 'click', 'purchase'
   metadata   jsonb,
   created_at timestamp default now()
);

create index if not exists idx_recommendation_events_user on
   recommendation_events (
      user_id
   );
create index if not exists idx_recommendation_events_model on
   recommendation_events (
      model_id
   );
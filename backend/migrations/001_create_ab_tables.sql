-- Migration: create recommendation_models and user_model_assignments
-- Run this against your Postgres database (psql or migration tool)

create table if not exists recommendation_models (
   id        serial primary key,
   name      varchar(100) not null,
   is_active boolean default true
);

create table if not exists user_model_assignments (
   user_id     integer primary key,
   model_id    integer
      references recommendation_models ( id )
         on delete cascade,
   assigned_at timestamp default now()
);

-- Optional helper: seed three models for A/B/C (ids will be 1,2,3 if table empty)
insert into recommendation_models (
   name,
   is_active
)
   select *
     from ( values ( 'collaborative',
                     true ),( 'content',
                              true ),( 'graph',
                                       true ) ) as v ( name,is_active )
    where not exists (
      select 1
        from recommendation_models
   );
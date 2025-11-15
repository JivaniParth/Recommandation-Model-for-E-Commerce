-- ecommerce-backend/db/create-schema-user.sql
-- Connect as SYSTEM or SYS to run this

-- Drop user if exists and recreate
declare
   user_exists number;
begin
   select count(*)
     into user_exists
     from dba_users
    where username = 'C##BOOKSTORE';

   if user_exists > 0 then
      execute immediate 'DROP USER C##BOOKSTORE CASCADE';
   end if;
end;
/

-- Create new user/schema
create user c##bookstore identified by bookstore123
   default tablespace users
   temporary tablespace temp
   quota unlimited on users;

-- Grant necessary privileges
grant connect,resource to c##bookstore;
grant create session,
   create table,
   create sequence,
   create view
to c##bookstore;
grant
   create trigger,
   create procedure
to c##bookstore;

commit;
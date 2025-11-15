# E-Commerce Backend (Oracle Database)

This is the Oracle Database backend for the Online Book Store application.

## Prerequisites

1. **Oracle Database** - Oracle XE or Oracle Database (running on `localhost:1521/freepdb1`)
2. **Node.js** - Version 14 or higher
3. **Oracle Instant Client** - Required for the `oracledb` npm package

## Oracle Instant Client Setup (Windows)

The `oracledb` npm package requires Oracle Instant Client libraries to connect to Oracle Database.

### Step 1: Download Oracle Instant Client

1. Visit: https://www.oracle.com/database/technologies/instant-client/winx64-64-downloads.html
2. Download **"Instant Client Basic Light"** or **"Instant Client Basic"** (ZIP file)
   - For Oracle 21c: Download version 21.x
   - For Oracle 19c: Download version 19.x

### Step 2: Extract and Install

1. Extract the ZIP file to a directory, for example:

   - `C:\oracle\instantclient_23_9`
   - `C:\oracle\instantclient_21_14`

2. **Option A: Add to PATH (Recommended)**

   - Open **System Properties** → **Environment Variables**
   - Edit the **PATH** system variable
   - Add your Instant Client directory (e.g., `C:\oracle\instantclient_23_9`)
   - Click **OK** and restart your terminal

3. **Option B: Configure in .env file**
   - Set the path in your `.env` file:
   ```
   ORACLE_INSTANT_CLIENT_PATH=C:\\oracle\\instantclient_23_9
   ```

### Step 3: Install Visual C++ Redistributable

Oracle Instant Client requires Microsoft Visual C++ Redistributable:

- Download from: https://aka.ms/vs/17/release/vc_redist.x64.exe
- Install and restart your computer if prompted

## Environment Configuration

Create or update your `.env` file:

```properties
# Database
ORACLE_USER="C##BOOKSTORE"
ORACLE_PASSWORD="bookstore123"
ORACLE_CONNECTION_STRING=localhost:1521/freepdb1

# Oracle Instant Client
# Set this to your Oracle Instant Client installation directory
ORACLE_INSTANT_CLIENT_PATH=C:\\oracle\\instantclient_23_9

# JWT
JWT_SECRET=mySecretKey123!BookStoreApp2025

# Server
PORT=5000
```

## Installation

```powershell
npm install
```

## Database Setup

1. Create the Oracle user and schema:

```sql
-- Run db/oracle-user.sql as SYSTEM or admin user
```

2. Create tables:

```sql
-- Run db/oracle-schema.sql as C##BOOKSTORE user
```

3. Seed data:

```sql
-- Run db/oracle-seed.sql as C##BOOKSTORE user
```

## Running the Server

Development mode (with auto-restart):

```powershell
npm run dev
```

Production mode:

```powershell
npm start
```

## API Endpoints

- **GET** `/api/admin/stats` - Get dashboard statistics
- **GET** `/api/admin/users` - Get all users
- **GET** `/api/admin/books` - Get all books
- **GET** `/api/admin/orders` - Get all orders
- And more... (check `routes/admin.js` for full list)

## Troubleshooting

### Error: DPI-1047: Cannot locate a 64-bit Oracle Client library

**Solution:**

1. Verify Oracle Instant Client is installed in the directory specified in your `.env` file
2. Make sure the path uses double backslashes: `C:\\oracle\\instantclient_23_9`
3. Ensure Visual C++ Redistributable is installed
4. Restart your terminal/IDE after modifying environment variables

### Error: ORA-12541: TNS:no listener

**Solution:**

1. Verify Oracle Database is running
2. Check the connection string in your `.env` file
3. Test connectivity: `sqlplus C##BOOKSTORE/bookstore123@localhost:1521/freepdb1`

### Error: ORA-01017: invalid username/password

**Solution:**

1. Verify the Oracle user exists: `SELECT username FROM all_users WHERE username = 'C##BOOKSTORE';`
2. Check credentials in your `.env` file
3. Recreate the user if needed using `db/oracle-user.sql`

## Development

This backend uses:

- **Express.js** - Web framework
- **oracledb** - Oracle Database driver
- **dotenv** - Environment variable management
- **nodemon** - Development auto-reload

## License

MIT

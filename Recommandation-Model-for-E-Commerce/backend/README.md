# Recommandation Model for E-Commerce (scaffold)

This repository is a scaffold for the recommendation model experiments described in the project plan.
It contains a minimal Node.js + Express API with: Postgres service stubs, Neo4j integration, and a sync script.

## What is included

- `index.js` — express server and route wiring
- `routes/recommendations.js` — unified recommendations endpoint
- `services/postgresService.js` — Postgres connection + placeholder SQL recommendation functions
- `services/neo4jService.js` — Neo4j connection + graph-based recommendation function
- `scripts/syncToNeo4j.js` — script to copy users/products/purchases from Postgres to Neo4j using drivers
- `package.json` — dependencies and scripts
- `oracle/` — Oracle SQL scripts (DDL, seed, PL/SQL helpers)
- `services/oracleService.js` — Oracle connection and recommendation helpers (uses oracledb)
- `routes/oracle.js` — HTTP API to fetch Oracle-backed recommendations

## Quick setup

1. Copy `.env.example` (create a `.env` file) and set values:

```
# Postgres
DATABASE_URL=postgresql://user:password@localhost:5432/shop
# Neo4j
NEO4J_URI=bolt://localhost:7687
NEO4J_USER=neo4j
NEO4J_PASSWORD=password
PORT=4000
```

2. Install dependencies

PowerShell:

```powershell
npm install
```

3. Start server

```powershell
npm run dev
# or
npm start
```

4. Sync data from Postgres to Neo4j (if your Postgres has `users`, `products`, `purchases` tables):

```powershell
npm run sync
```

5. Try the API

```powershell
# Graph-based recommendations
curl http://localhost:4000/api/recommendations/1?model=graph

# Collaborative
curl http://localhost:4000/api/recommendations/1?model=collab

# Content based
curl http://localhost:4000/api/recommendations/1?model=content
```

## Notes & next steps

This scaffold previously included Oracle schema and helper scripts. Oracle support has been removed from this folder; the remaining services provide Postgres and Neo4j stubs/mocks for local prototyping. Use the `migrations/` SQL files for Postgres (if you run a Postgres instance) and the `scripts/` helpers to sync to Neo4j.

## A/B assignment endpoints

Run the migration SQL in `migrations/001_create_ab_tables.sql` against your Postgres DB (psql or your migration tool).

Endpoints added:

- POST /api/ab/assign-all?models=1,2,3

  - Bulk assign all users to provided model ids (round-robin). If `models` not provided, defaults to `1,2,3`.

- GET /api/ab/user/:userId

  - Returns the user's assigned model. If the user has no assignment, a random active model is chosen and assigned.

Integrate this API with the Online Book Store frontend by replacing the recommendation calls with the new API.

## Event logging (impressions & clicks)

Run the migration `migrations/002_create_events.sql` to create the `recommendation_events` table used for logging.

Endpoints added:

- POST /api/events

  - Body: { user_id, product_id, model_id, event_type, metadata }
  - Logs an event (impression, click, purchase, etc.). `metadata` is optional JSON.

- GET /api/events/model/:modelId/counts
  - Returns counts grouped by event_type for the given model id.

## References

See `PROJECTPLAN.md` in the parent directory for the full plan and timeline.

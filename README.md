# Threat Intelligence REST API

REST API for querying threat intelligence data - indicators, campaigns, threat actors, and dashboard stats.

Built with TypeScript, Fastify, and SQLite.

> **Note:** This is a take-home technical challenge. See [CHALLENGE.md](./docs/CHALLENGE.md) for the original requirements.

## Quick Start

```bash
npm install
npm run dev
```

Server runs at `http://localhost:3000`

API docs at `http://localhost:3000/documentation`

Or use Docker if you prefer:

```bash
npm run docker:up
npm run docker:logs
npm run docker:down
```

## Endpoints

### Get Indicator Details

```bash
GET /api/indicators/:id
```

Returns indicator data with associated threat actors, campaigns, and related indicators.

Example:

```bash
curl http://localhost:3000/api/indicators/56bb178b-52bd-4d30-8bc1-790b79c16499
```

### Search Indicators

```bash
GET /api/indicators/search
```

Supports filtering by type, value, threat actor, campaign, and date ranges. Paginated.

Query params: `type`, `value`, `threat_actor`, `campaign`, `first_seen_after`, `last_seen_before`, `page`, `limit`

Example:

```bash
curl "http://localhost:3000/api/indicators/search?type=domain&limit=10"
```

### Campaign Timeline

```bash
GET /api/campaigns/:id/indicators
```

Returns indicators for a campaign grouped by day or week.

Query params: `group_by` (day|week), `start_date`, `end_date`

Example:

```bash
curl "http://localhost:3000/api/campaigns/6d25532f-81ab-491d-89c4-436b53b57f9b/indicators?group_by=week"
```

### Dashboard Summary

```bash
GET /api/dashboard/summary
```

Returns stats: indicator distribution, new indicators, active campaigns, top threat actors and campaigns.

Query params: `time_range` (24h|7d|30d)

Example:

```bash
curl "http://localhost:3000/api/dashboard/summary?time_range=7d"
```

## Response Format

All responses follow the same structure:

Success:

```json
{
  "success": true,
  "data": { ... }
}
```

Error:

```json
{
  "success": false,
  "error": {
    "code": "NOT_FOUND",
    "message": "Indicator with id 'xxx' not found"
  }
}
```

## Development

```bash
npm run dev     # Dev server with hot reload
npm run build   # Build for production
npm start       # Run production build
npm test        # Run tests (50 tests, all passing)
```

## Tech Stack

- **Fastify** - Fast web framework with good TypeScript support
- **TypeScript** - Strict mode enabled
- **Zod** - Runtime validation for all inputs
- **better-sqlite3** - SQLite with prepared statements
- **Vitest** - Testing

## Database

SQLite database with ~10k indicators (IPs, domains, URLs, hashes), 50 threat actors, and 100 campaigns.

Using WAL mode for concurrent reads and proper indexing.

## Architecture Decisions

**Why 4 parallel queries instead of complex JOINs?**

For the indicator details endpoint, I use 4 separate queries in parallel instead of one big JOIN. This avoids the cartesian product problem and is actually faster with SQLite. Each query is simple and uses its own indexes efficiently.

**Why offset pagination?**

With 10k records, LIMIT/OFFSET is fine. If this scaled to millions, I'd switch to cursor-based.

**Why cache the dashboard?**

Dashboard stats are expensive to compute (6 aggregation queries) and don't need to be real-time. 5-minute cache is a good tradeoff.

## What I'd Add With More Time

- Cursor-based pagination for very large result sets
- Redis for distributed caching
- Full-text search (probably Elasticsearch)
- More comprehensive unit tests (currently focused on integration tests)
- Rate limiting
- Authentication/API keys
- Metrics endpoint for monitoring

See [ARCHITECTURE.md](./docs/ARCHITECTURE.md) for detailed design decisions and scaling strategy.

See [QUERIES.md](./docs/QUERIES.md) for query optimization details.

## Project Structure

```
src/
├── modules/
│   ├── indicators/    # Indicator routes, schemas, queries, service
│   ├── campaigns/     # Campaign routes, schemas, queries, service
│   └── dashboard/     # Dashboard routes, schemas, queries, service
├── shared/            # Common utilities (errors, pagination, response)
├── db/                # Database client (singleton pattern)
├── config/            # Environment config
└── app.ts             # Fastify setup
```

Each module has:

- `routes.ts` - HTTP handlers
- `schema.ts` - Zod validation schemas
- `service.ts` - Business logic
- `queries.ts` - SQL queries
- `types.ts` - TypeScript interfaces

## Testing

50 integration tests covering all endpoints, error cases, validation, and pagination.

Using real SQLite database in tests (fast enough, gives more confidence than mocks).

## Assumptions

- Read-heavy workload (so WAL mode + caching make sense)
- Dashboard doesn't need real-time data
- 10k records is manageable with SQLite + offset pagination
- Most queries will filter by type, date range, or specific IDs

## License

MIT

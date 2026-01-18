# Architecture Notes

Some thoughts on how I structured this thing and why.

## Module Organization

Each feature (indicators, campaigns, dashboard) has its own folder with:

- `routes.ts` - Fastify route handlers
- `schema.ts` - Zod schemas for validation
- `service.ts` - Business logic
- `queries.ts` - SQL queries
- `types.ts` - TypeScript interfaces

Pretty standard layered approach. Keeps things organized and makes it easy to find stuff.

## Big Decisions

### Parallel Queries Instead of Big JOINs

For the indicator details endpoint, I fetch data with 4 separate queries running in parallel:

```typescript
const [indicator, threatActors, campaigns, relatedIndicators] =
  await Promise.all([
    queries.getIndicator(id),
    queries.getThreatActors(id),
    queries.getCampaigns(id),
    queries.getRelatedIndicators(id),
  ]);
```

Why not one big JOIN? A few reasons:

1. SQLite doesn't optimize complex JOINs that well
2. Each simple query can use its indexes efficiently
3. Way easier to read and maintain
4. With Promise.all, they run in parallel anyway so total time is just the slowest query

The "correct" approach would be one query with multiple LEFT JOINs and GROUP BY, but that creates a cartesian product and requires JSON aggregation which is messy. This is simpler and actually faster.

### Offset Pagination

Using simple LIMIT/OFFSET pagination:

```typescript
const offset = (page - 1) * limit;
const sql = `SELECT * FROM indicators WHERE ... LIMIT ? OFFSET ?`;
```

Yeah, I know cursor-based pagination is "better" for large datasets, but:

- We have 10k records, not 10 million
- Offset is way simpler to implement
- URLs like `?page=2` are more intuitive than encoded cursors
- If this scaled to millions, I'd switch to cursor-based

Not everything needs to be over-engineered for hypothetical scale.

### Dashboard Caching

Dashboard stats are cached in memory for 5 minutes:

```typescript
const CACHE_TTL = 5 * 60 * 1000;
let cache = null;

if (cache && Date.now() - cache.timestamp < CACHE_TTL) {
  return cache.data;
}
```

Why cache?

- Dashboard queries are expensive (6 aggregations)
- Stats don't need to be real-time
- Most users hit dashboard first and refresh it

Why in-memory instead of Redis?

- This is a single server
- Adding Redis would be overkill for 10k records
- Cache survives restarts anyway since data rarely changes

If this ran on multiple servers, yeah, you'd need Redis or similar.

### Error Handling

Custom error classes that extend Error:

```typescript
export class NotFoundError extends AppError {
  constructor(resource: string, id: string) {
    super(`${resource} with id '${id}' not found`, 404, "NOT_FOUND");
  }
}
```

Then a global error handler catches them and formats responses:

```typescript
app.setErrorHandler((error, request, reply) => {
  if (error instanceof AppError) {
    return reply.status(error.statusCode).send({
      success: false,
      error: { code: error.code, message: error.message },
    });
  }
  // handle other errors...
});
```

Makes error responses consistent and keeps the route handlers clean.

### Zod for Validation

All inputs are validated with Zod schemas:

```typescript
export const SearchQuerySchema = z.object({
  type: z.enum(["ip", "domain", "url", "hash"]).optional(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
});

export type SearchQuery = z.infer<typeof SearchQuerySchema>;
```

Nice thing about Zod is you get TypeScript types for free. And it handles coercion (string query params to numbers) automatically.

## If This Scaled to 100M Indicators

Current setup works fine for 10k records, but here's what would need to change:

### Database: SQLite → PostgreSQL

SQLite starts struggling around 1M records with concurrent writes. Would need to migrate to Postgres with:

- Connection pooling (20-30 connections)
- Read replicas for scaling reads
- Better query optimizer
- JSONB support for flexible fields

```typescript
// Replace singleton with pool
import { Pool } from "pg";
export const pool = new Pool({
  max: 20,
  host: config.db.host,
  database: config.db.name,
});
```

### Search: PostgreSQL → Elasticsearch

Full-text search and complex filters get slow in SQL at scale. Would move search to Elasticsearch:

```typescript
// Search in ES, fetch details from Postgres
const esResults = await esClient.search({
  index: "indicators",
  body: {
    query: { match: { value: searchTerm } },
    size: 20,
  },
});

const ids = esResults.hits.map((h) => h._id);
return pool.query("SELECT * FROM indicators WHERE id = ANY($1)", [ids]);
```

### Caching: In-Memory → Redis

In-memory cache doesn't work across multiple servers. Would need Redis:

```typescript
const cached = await redis.get(`dashboard:${timeRange}`);
if (cached) return JSON.parse(cached);

const stats = await computeStats(timeRange);
await redis.setex(`dashboard:${timeRange}`, 300, JSON.stringify(stats));
return stats;
```

### Database Optimizations

Add composite indexes for common query patterns:

```sql
-- Instead of separate indexes on type and first_seen
CREATE INDEX idx_indicators_type_first_seen
  ON indicators(type, first_seen DESC);

-- Partial index for active campaigns
CREATE INDEX idx_active_campaigns
  ON campaigns(status)
  WHERE status = 'active';
```

Partition by date for time-series data:

```sql
CREATE TABLE indicators_2024_01 PARTITION OF indicators
  FOR VALUES FROM ('2024-01-01') TO ('2024-02-01');
```

## What I Didn't Do (But Would In Production)

- Structured logging with request IDs
- Prometheus metrics endpoint
- Database migrations system
- API authentication
- Rate limiting
- CORS properly configured
- More comprehensive unit tests

Most of these are important for production but felt like overkill for a take-home project.

## The Point

Architecture is about trade-offs. The "right" design depends on your constraints:

- 10k records? SQLite + simple caching works great
- 1M records? Need Postgres + Redis
- 100M records? Need the full stack (replicas, ES, background jobs)

Starting simple and scaling up is better than building for hypothetical scale you might never hit.

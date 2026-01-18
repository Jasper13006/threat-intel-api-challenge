# Query Optimizations

Notes on how I optimized the database queries and why certain approaches work better than others.

## Query 1: Fetching Indicator with All Relationships

### The Problem

Need to get an indicator with:

- Its basic data
- Associated threat actors (through campaigns)
- Related campaigns
- Related indicators

### What I Didn't Do: N+1 Queries

```typescript
// BAD - This is the classic N+1 problem
const indicator = await getIndicator(id);

for (const campaign of indicator.campaigns) {
  const actors = await getThreatActors(campaign.id); // N queries
}

for (const rel of indicator.relationships) {
  const related = await getRelatedIndicator(rel.id); // M more queries
}
// Total: 1 + N + M queries, could be 50+
```

This is obviously terrible. Each query has overhead, and they're sequential.

### What I Also Didn't Do: Giant JOIN

```sql
SELECT i.*, ta.*, c.*, ri.*
FROM indicators i
LEFT JOIN campaign_indicators ci ON i.id = ci.indicator_id
LEFT JOIN campaigns c ON ci.campaign_id = c.id
LEFT JOIN actor_campaigns ac ON c.id = ac.campaign_id
LEFT JOIN threat_actors ta ON ac.threat_actor_id = ta.id
LEFT JOIN indicator_relationships ir ON i.id = ir.source_indicator_id
LEFT JOIN indicators ri ON ir.target_indicator_id = ri.id
WHERE i.id = ?
```

Problems:

- Creates a cartesian product (1 indicator × N campaigns × M actors × P related)
- SQLite's query planner doesn't handle this well
- Need to manually group results in code anyway

### What I Actually Did: 4 Parallel Simple Queries

```typescript
const [indicator, threatActors, campaigns, relatedIndicators] =
  await Promise.all([
    db.prepare("SELECT * FROM indicators WHERE id = ?").get(id),

    db
      .prepare(
        `
    SELECT DISTINCT ta.id, ta.name, ac.confidence
    FROM threat_actors ta
    JOIN actor_campaigns ac ON ta.id = ac.threat_actor_id
    JOIN campaign_indicators ci ON ac.campaign_id = ci.campaign_id
    WHERE ci.indicator_id = ?
  `,
      )
      .all(id),

    db
      .prepare(
        `
    SELECT c.id, c.name, c.status, ci.observed_at
    FROM campaigns c
    JOIN campaign_indicators ci ON c.id = ci.campaign_id
    WHERE ci.indicator_id = ?
  `,
      )
      .all(id),

    db
      .prepare(
        `
    SELECT i.id, i.type, i.value, ir.relationship_type
    FROM indicators i
    JOIN indicator_relationships ir ON i.id = ir.target_indicator_id
    WHERE ir.source_indicator_id = ?
    LIMIT 5
  `,
      )
      .all(id),
  ]);
```

Why this works:

1. Each query is simple and uses indexes well
2. SQLite can optimize each one independently
3. Promise.all runs them in parallel (no network latency since SQLite is in-process)
4. Total time = slowest query, not sum of all queries
5. Way easier to understand and modify

Much faster than the complex JOIN approach I tried initially.

## Query 2: Dashboard Statistics

### The Problem

Dashboard needs 6 different aggregations:

1. Indicator count by type
2. New indicators in time range
3. Active campaigns count
4. Top 5 threat actors
5. Recent observations count
6. Top 5 campaigns

### Naive Approach: Sequential

```typescript
const distribution = await getIndicatorDistribution();
const newCount = await getNewIndicatorsCount(timeRange);
const activeCampaigns = await getActiveCampaignsCount();
// ... etc
```

Sequential execution wastes time. We can do better.

### My Solution: Parallel Queries + Caching

```typescript
// 5 minute cache
const CACHE_TTL = 5 * 60 * 1000;
let cache = null;

if (
  cache?.timeRange === timeRange &&
  Date.now() - cache.timestamp < CACHE_TTL
) {
  return cache.data; // Fast
}

const [
  distribution,
  newCount,
  activeCampaigns,
  topActors,
  observations,
  topCampaigns,
] = await Promise.all([
  queries.getIndicatorDistribution(),
  queries.getNewIndicatorsCount(timeRange),
  queries.getActiveCampaignsCount(),
  queries.getTopThreatActors(),
  queries.getRecentObservationsCount(timeRange),
  queries.getTopCampaigns(),
]);

cache = { data: stats, timestamp: Date.now(), timeRange };
```

Parallel execution means total time = slowest query, not sum of all queries.

Cache makes a big difference - most requests hit the cache.

### The Critical Index I Added

One of these queries was initially slow:

```sql
SELECT COUNT(*) FROM indicators
WHERE created_at >= datetime('now', '-7 days')
```

Without an index on `created_at`, this does a full table scan (10k rows).

I added:

```sql
CREATE INDEX idx_indicators_created_at ON indicators(created_at);
```

Now it's an index range scan. Much faster.

Always check your WHERE clauses - if you're filtering on a column frequently, index it.

## Query 3: Search with Dynamic Filters

### The Problem

Search endpoint supports optional filters:

- type (ip/domain/url/hash)
- value (partial match)
- threat_actor
- campaign
- date ranges

Can't know ahead of time which filters will be used.

### Bad Approach: String Concatenation

```typescript
// DON'T DO THIS - SQL injection!
let sql = "SELECT * FROM indicators WHERE 1=1";
if (filters.type) {
  sql += ` AND type = '${filters.type}'`;
}
if (filters.value) {
  sql += ` AND value LIKE '%${filters.value}%'`;
}
```

This is a security nightmare.

### My Approach: Dynamic Parameterized Query

```typescript
let sql = `
  SELECT DISTINCT i.*
  FROM indicators i
  LEFT JOIN campaign_indicators ci ON i.id = ci.indicator_id
  LEFT JOIN actor_campaigns ac ON ci.campaign_id = ac.campaign_id
  WHERE 1=1
`;

const params = [];

if (filters.type) {
  sql += " AND i.type = ?";
  params.push(filters.type);
}

if (filters.value) {
  sql += " AND i.value LIKE ?";
  params.push(`%${filters.value}%`);
}

if (filters.threat_actor) {
  sql += " AND ac.threat_actor_id = ?";
  params.push(filters.threat_actor);
}

sql += " ORDER BY i.first_seen DESC LIMIT ? OFFSET ?";
params.push(limit, offset);

return db.prepare(sql).all(...params);
```

Safe from SQL injection and still flexible.

### Index Strategy

For the most common filter pattern (type + recent), I could add a composite index:

```sql
CREATE INDEX idx_indicators_type_first_seen
  ON indicators(type, first_seen DESC);
```

This would let queries like "get recent IPs" use the index directly without a separate sort step.

But I didn't add it because:

- Current performance is fine
- Not sure yet which filter combos are most common
- Don't want to over-index (each index slows writes)

Would add it if I saw this query pattern being slow in production.

## General Lessons

### 1. Parallel > Sequential

If queries don't depend on each other, run them in parallel. Promise.all is your friend.

### 2. Simple > Complex

Multiple simple queries are often faster and way easier to maintain than one complex query, especially with SQLite.

### 3. Index Strategically

Index columns you filter on frequently (WHERE, JOIN conditions). But don't go crazy - too many indexes slow down writes.

### 4. Use EXPLAIN

When optimizing, check the query plan:

```sql
EXPLAIN QUERY PLAN
SELECT * FROM indicators WHERE created_at >= datetime('now', '-7 days');
```

Look for:

- "SEARCH ... USING INDEX" = good
- "SCAN TABLE" = probably missing an index
- "TEMP B-TREE" = extra sort step, might want composite index

### 5. Cache Expensive Queries

Dashboard aggregations are expensive and don't need to be real-time. 5 minute cache cuts DB load significantly.

### 6. Limit Results

Always use LIMIT on queries that could return many rows. Nobody needs 10k results at once anyway.

## If This Scaled

At 100M indicators, some things would need to change:

**PostgreSQL instead of SQLite**: Better query optimizer, concurrent writes, read replicas

**Elasticsearch for search**: Full-text search and complex filters get slow in SQL at scale

**Redis for caching**: In-memory cache doesn't work across multiple servers

**Materialized views**: Pre-compute expensive aggregations

But for 10k records? Current approach is simple and fast enough. Don't optimize for problems you don't have yet.

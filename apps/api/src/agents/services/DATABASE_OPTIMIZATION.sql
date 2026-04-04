-- ============================================================================
-- MarketplaceSearchService Database Optimization
-- ============================================================================
-- These indexes should be created to optimize query performance for
-- the MarketplaceSearchService. Run in production after testing.

-- ============================================================================
-- 1. AGENT PROFILE INDEXES
-- ============================================================================

-- Index for basic published/indexable filtering
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_agent_published_indexable
ON agent_profiles(is_published, is_indexable)
WHERE is_published = true AND is_indexable = true;

-- Index for rating-based sorting/filtering
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_agent_cached_rating
ON agent_profiles(cached_rating DESC NULLS LAST);

-- Index for ROAS filtering (stored in JSONB)
-- Note: This requires functional index on JSONB path
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_agent_avg_roas
ON agent_profiles(((cached_stats->>'avgROAS')::DECIMAL) DESC NULLS LAST);

-- Index for CPA filtering (stored in JSONB)
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_agent_avg_cpa
ON agent_profiles(((cached_stats->>'avgCPA')::DECIMAL) ASC NULLS LAST);

-- Full-text search index on search_keywords
-- Requires: search_keywords column with GIN index for PostgreSQL FTS
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_agent_search_keywords_gin
ON agent_profiles USING GIN(to_tsvector('english', search_keywords));

-- Alternative for prefix/contains search
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_agent_search_keywords_btree
ON agent_profiles(search_keywords);

-- GIN index for array-based platform filtering
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_agent_platforms_gin
ON agent_profiles USING GIN(platforms);

-- GIN index for array-based niche filtering
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_agent_niches_gin
ON agent_profiles USING GIN(niches);

-- B-tree index for price range filtering
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_agent_monthly_rate
ON agent_profiles(monthly_rate ASC);

-- Index for verification status filtering
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_agent_is_verified
ON agent_profiles(is_verified);

-- Index for featured filtering
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_agent_is_featured
ON agent_profiles(is_featured);

-- Index for experience filtering (using creation date)
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_agent_created_at
ON agent_profiles(created_at DESC);

-- Index for popularity score sorting
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_agent_popularity_score
ON agent_profiles(popularity_score DESC NULLS LAST);

-- Combined index for common filter combinations
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_agent_published_rating_roas
ON agent_profiles(is_published, is_indexable, cached_rating DESC)
WHERE is_published = true AND is_indexable = true;


-- ============================================================================
-- 2. AGENT LANGUAGE INDEXES
-- ============================================================================

-- Index for language-based filtering
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_agent_language_code
ON agent_languages(language_code);

-- Index for agent-language joins
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_agent_language_agent_id
ON agent_languages(agent_profile_id);

-- Combined index for language filtering with proficiency
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_agent_language_proficiency
ON agent_languages(agent_profile_id, language_code, proficiency);


-- ============================================================================
-- 3. AGENT GEOGRAPHIC COVERAGE INDEXES
-- ============================================================================

-- Index for country-based filtering
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_agent_geo_country_code
ON agent_geographic_coverage(country_code);

-- Index for agent-geography joins
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_agent_geo_agent_id
ON agent_geographic_coverage(agent_profile_id);

-- Index for coverage type filtering
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_agent_geo_coverage_type
ON agent_geographic_coverage(coverage_type);

-- Combined index for geography filtering
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_agent_geo_country_coverage
ON agent_geographic_coverage(agent_profile_id, country_code, coverage_type);


-- ============================================================================
-- 4. AGENT CERTIFICATION INDEXES
-- ============================================================================

-- Index for certification filtering
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_agent_cert_certification_id
ON agent_certifications(certification_id);

-- Index for agent-certification joins
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_agent_cert_agent_id
ON agent_certifications(agent_profile_id);

-- Index for verification status filtering
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_agent_cert_verification_status
ON agent_certifications(verification_status);

-- Combined index for certification filtering
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_agent_cert_agent_verified
ON agent_certifications(agent_profile_id, certification_id, verification_status);


-- ============================================================================
-- 5. AGENT PLATFORM METRICS INDEXES
-- ============================================================================

-- Index for metrics queries
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_agent_metrics_agent_platform
ON agent_platform_metrics(agent_profile_id, platform);

-- Index for time-series queries
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_agent_metrics_period
ON agent_platform_metrics(aggregation_period DESC);

-- Index for synced_at (used for data freshness)
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_agent_metrics_synced_at
ON agent_platform_metrics(synced_at DESC);

-- Combined index for common metric queries
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_agent_metrics_agent_platform_period
ON agent_platform_metrics(agent_profile_id, platform, aggregation_period DESC);


-- ============================================================================
-- 6. AGENT HISTORICAL PERFORMANCE INDEXES
-- ============================================================================

-- Index for historical performance queries
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_agent_hist_perf_agent_id
ON agent_historical_performance(agent_profile_id);

-- Index for time-based queries
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_agent_hist_perf_year_month
ON agent_historical_performance(year_month DESC);

-- Combined index for performance timeline
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_agent_hist_perf_agent_period
ON agent_historical_performance(agent_profile_id, year_month DESC);


-- ============================================================================
-- 7. AGENT REVIEWS INDEXES
-- ============================================================================

-- Index for review-based sorting
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_agent_review_agent_id
ON agent_reviews(agent_profile_id);

-- Index for recent reviews
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_agent_review_created_at
ON agent_reviews(created_at DESC);

-- Index for verified reviews
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_agent_review_is_verified
ON agent_reviews(is_verified);

-- Combined index for review queries
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_agent_review_agent_created
ON agent_reviews(agent_profile_id, created_at DESC);


-- ============================================================================
-- 8. MARKETPLACE CERTIFICATION INDEXES
-- ============================================================================

-- Index for certification lookups
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_marketplace_cert_slug
ON marketplace_certifications(slug);

-- Index for active certifications
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_marketplace_cert_active
ON marketplace_certifications(is_active);


-- ============================================================================
-- 9. COMPOSITE INDEXES FOR COMPLEX QUERIES
-- ============================================================================

-- Index for search + published + indexable queries
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_agent_search_published
ON agent_profiles(is_published, is_indexable)
WHERE is_published = true AND is_indexable = true;

-- Index for search + platform + niche + rating
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_agent_platforms_niches_rating
ON agent_profiles(is_published, is_indexable, cached_rating DESC)
WHERE is_published = true AND is_indexable = true;


-- ============================================================================
-- 10. CLUSTER INDEXES (Improve sequential reads)
-- ============================================================================

-- Cluster agent_profiles by rating for better cache locality
CLUSTER agent_profiles USING idx_agent_cached_rating;

-- Cluster agent_platform_metrics by agent_profile_id for join performance
CLUSTER agent_platform_metrics USING idx_agent_metrics_agent_platform;


-- ============================================================================
-- 11. STATISTICS AND ANALYSIS
-- ============================================================================

-- Analyze tables to update query planner statistics
ANALYZE agent_profiles;
ANALYZE agent_languages;
ANALYZE agent_geographic_coverage;
ANALYZE agent_certifications;
ANALYZE agent_platform_metrics;
ANALYZE agent_historical_performance;
ANALYZE agent_reviews;
ANALYZE marketplace_certifications;


-- ============================================================================
-- 12. VACUUM CONFIGURATION
-- ============================================================================

-- For active tables, set aggressive auto-vacuum parameters
ALTER TABLE agent_profiles
SET (autovacuum_vacuum_scale_factor = 0.02, autovacuum_analyze_scale_factor = 0.01);

ALTER TABLE agent_platform_metrics
SET (autovacuum_vacuum_scale_factor = 0.02, autovacuum_analyze_scale_factor = 0.01);


-- ============================================================================
-- PERFORMANCE VERIFICATION QUERIES
-- ============================================================================

-- Check index usage statistics
-- Run after production traffic for 1-2 weeks
SELECT
  schemaname,
  tablename,
  indexname,
  idx_scan,
  idx_tup_read,
  idx_tup_fetch
FROM pg_stat_user_indexes
WHERE schemaname = 'public'
ORDER BY idx_scan DESC;

-- Check missing indexes (unused indexes)
SELECT
  schemaname,
  tablename,
  indexname,
  idx_scan
FROM pg_stat_user_indexes
WHERE schemaname = 'public'
AND idx_scan = 0
ORDER BY tablename;

-- Estimate index sizes
SELECT
  indexname,
  pg_size_pretty(pg_relation_size(indexrelid)) as index_size
FROM pg_stat_user_indexes
WHERE schemaname = 'public'
ORDER BY pg_relation_size(indexrelid) DESC;


-- ============================================================================
-- INDEX MAINTENANCE QUERIES
-- ============================================================================

-- Rebuild fragmented indexes (for maintenance windows)
-- REINDEX INDEX CONCURRENTLY idx_agent_published_indexable;
-- REINDEX INDEX CONCURRENTLY idx_agent_cached_rating;

-- Drop unused indexes after verification
-- DROP INDEX CONCURRENTLY idx_unused_index_name;


-- ============================================================================
-- NOTES
-- ============================================================================

-- 1. Use CONCURRENTLY flag to avoid locking tables during index creation
--    (Available in PostgreSQL 9.2+)
--
-- 2. Cluster operation locks table - schedule for maintenance window
--
-- 3. Monitor index size growth over time
--
-- 4. Review query plans monthly:
--    EXPLAIN ANALYZE SELECT ... FROM ...
--
-- 5. Consider partitioning agent_platform_metrics by date
--    if table grows beyond 100M rows
--
-- 6. Set up monitoring for slow queries (log_min_duration_statement)
--
-- 7. Update table statistics weekly:
--    ANALYZE agent_profiles;
--
-- 8. For very large datasets (1M+ rows), consider:
--    - Table partitioning by country or platform
--    - Elasticsearch for full-text search
--    - Redis caching layer
--
-- 9. Test all indexes in development/staging before production
--
-- 10. Parallel query execution can improve performance significantly
--     SET max_parallel_workers_per_gather = 4;

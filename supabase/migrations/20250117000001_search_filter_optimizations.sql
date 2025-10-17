-- ============================================================================
-- SEARCH & FILTER OPTIMIZATIONS
-- ============================================================================
-- This migration adds database indexes and functions to optimize the new
-- advanced search and filter system in SmartThrift Marketplace.
-- ============================================================================

-- 1. INDEX FOR PRICE RANGE FILTER
-- Speeds up queries filtering by price range
CREATE INDEX IF NOT EXISTS idx_listings_price 
ON public.listings(price);

-- 2. INDEX FOR CONDITION FILTER
-- Speeds up queries filtering by condition
CREATE INDEX IF NOT EXISTS idx_listings_condition 
ON public.listings(condition);

-- 3. INDEX FOR CATEGORY FILTER
-- Speeds up queries filtering by category
CREATE INDEX IF NOT EXISTS idx_listings_category 
ON public.listings(category);

-- 4. INDEX FOR SORTING BY DATE
-- Speeds up "Newest First" and "Oldest First" sorting
CREATE INDEX IF NOT EXISTS idx_listings_created_at 
ON public.listings(created_at DESC);

-- 5. COMPOSITE INDEX FOR PRICE + CREATED_AT
-- Optimizes common filter combinations (price range + newest first)
CREATE INDEX IF NOT EXISTS idx_listings_price_created_at 
ON public.listings(price, created_at DESC);

-- 6. INDEX FOR ACTIVE LISTINGS ONLY
-- Filter out sold/inactive listings faster
CREATE INDEX IF NOT EXISTS idx_listings_active 
ON public.listings(status) 
WHERE status = 'active';

-- ============================================================================
-- GEOLOCATION SUPPORT (Optional - for Distance Filter)
-- ============================================================================
-- Uncomment these if you want to implement real distance filtering

-- Add latitude and longitude columns
-- ALTER TABLE public.listings 
-- ADD COLUMN IF NOT EXISTS latitude DECIMAL(10, 8),
-- ADD COLUMN IF NOT EXISTS longitude DECIMAL(11, 8);

-- Add geolocation index using PostGIS (requires postgis extension)
-- CREATE EXTENSION IF NOT EXISTS postgis;
-- CREATE INDEX IF NOT EXISTS idx_listings_location 
-- ON public.listings USING GIST (
--   ST_SetSRID(ST_MakePoint(longitude, latitude), 4326)
-- );

-- Function to calculate distance between two points
-- CREATE OR REPLACE FUNCTION get_distance_km(
--   lat1 DECIMAL, lon1 DECIMAL,
--   lat2 DECIMAL, lon2 DECIMAL
-- ) RETURNS DECIMAL AS $$
--   SELECT (
--     6371 * acos(
--       cos(radians(lat1)) * 
--       cos(radians(lat2)) * 
--       cos(radians(lon2) - radians(lon1)) + 
--       sin(radians(lat1)) * 
--       sin(radians(lat2))
--     )
--   );
-- $$ LANGUAGE SQL IMMUTABLE;

-- ============================================================================
-- MATERIALIZED VIEW FOR LISTING RATINGS (Performance Boost)
-- ============================================================================
-- Pre-calculate average ratings instead of computing on every request

-- Drop existing view if it exists
DROP MATERIALIZED VIEW IF EXISTS listing_ratings CASCADE;

-- Create materialized view
CREATE MATERIALIZED VIEW listing_ratings AS
SELECT 
  listing_id,
  AVG(rating)::DECIMAL(3,2) as average_rating,
  COUNT(*)::INTEGER as review_count
FROM public.reviews
GROUP BY listing_id;

-- Create index on the materialized view
CREATE UNIQUE INDEX idx_listing_ratings_id 
ON listing_ratings(listing_id);

-- Function to refresh the materialized view
CREATE OR REPLACE FUNCTION refresh_listing_ratings()
RETURNS void 
SECURITY DEFINER
AS $$
BEGIN
  REFRESH MATERIALIZED VIEW CONCURRENTLY listing_ratings;
EXCEPTION
  WHEN OTHERS THEN
    -- If concurrent refresh fails, do regular refresh
    REFRESH MATERIALIZED VIEW listing_ratings;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- SEARCH OPTIMIZATION (Full-Text Search)
-- ============================================================================
-- Add full-text search index for better search performance

-- Create text search vector column (check if it exists first)
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'listings' 
    AND column_name = 'search_vector'
  ) THEN
    ALTER TABLE public.listings 
    ADD COLUMN search_vector tsvector
    GENERATED ALWAYS AS (
      to_tsvector('english', 
        coalesce(title, '') || ' ' || 
        coalesce(description, '') || ' ' || 
        coalesce(location, '') || ' ' ||
        coalesce(category, '')
      )
    ) STORED;
  END IF;
END $$;

-- Create GIN index for fast full-text search
CREATE INDEX IF NOT EXISTS idx_listings_search 
ON public.listings USING GIN(search_vector);

-- Function to search listings (example usage)
CREATE OR REPLACE FUNCTION search_listings(search_query TEXT)
RETURNS TABLE (
  id UUID,
  title TEXT,
  description TEXT,
  price NUMERIC,
  relevance REAL
) 
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    l.id,
    l.title,
    l.description,
    l.price,
    ts_rank(l.search_vector, plainto_tsquery('english', search_query))::REAL as relevance
  FROM public.listings l
  WHERE l.search_vector @@ plainto_tsquery('english', search_query)
  ORDER BY ts_rank(l.search_vector, plainto_tsquery('english', search_query)) DESC;
END;
$$;

-- ============================================================================
-- TRIGGER TO REFRESH RATINGS (Auto-update)
-- ============================================================================
-- Automatically refresh ratings when new reviews are added

CREATE OR REPLACE FUNCTION trigger_refresh_ratings()
RETURNS TRIGGER AS $$
BEGIN
  PERFORM refresh_listing_ratings();
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Create trigger on reviews table
DROP TRIGGER IF EXISTS reviews_changed ON public.reviews;
CREATE TRIGGER reviews_changed
AFTER INSERT OR UPDATE OR DELETE ON public.reviews
FOR EACH STATEMENT
EXECUTE FUNCTION trigger_refresh_ratings();

-- ============================================================================
-- ANALYTICS FUNCTION (Bonus)
-- ============================================================================
-- Get popular filter combinations to optimize further

CREATE TABLE IF NOT EXISTS public.filter_analytics (
  id SERIAL PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  filter_type TEXT NOT NULL,
  filter_value TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_filter_analytics_created 
ON public.filter_analytics(created_at DESC);

-- ============================================================================
-- GRANT PERMISSIONS
-- ============================================================================

-- Allow authenticated users to access the materialized view
GRANT SELECT ON public.listing_ratings TO authenticated;
GRANT SELECT ON public.listing_ratings TO anon;

-- Enable RLS on filter_analytics table
ALTER TABLE public.filter_analytics ENABLE ROW LEVEL SECURITY;

-- RLS Policy: Users can view their own analytics
CREATE POLICY "Users can view own analytics"
ON public.filter_analytics
FOR SELECT
USING (auth.uid() = user_id);

-- RLS Policy: Users can insert their own analytics
CREATE POLICY "Users can insert own analytics"
ON public.filter_analytics
FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- ============================================================================
-- VERIFICATION
-- ============================================================================
-- Run this to verify indexes were created:
-- SELECT indexname, tablename FROM pg_indexes WHERE schemaname = 'public' ORDER BY tablename, indexname;

-- Run this to check materialized view:
-- SELECT * FROM listing_ratings LIMIT 10;


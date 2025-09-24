-- Create triggers and scheduled jobs for database maintenance
-- This script sets up automated database maintenance tasks

-- First, check if the set_expiration_date function exists, if not create it
CREATE OR REPLACE FUNCTION set_expiration_date()
RETURNS TRIGGER AS $$
BEGIN
    -- Set expiration to 60 days from creation
    NEW.expires_at := NEW.created_at + INTERVAL '60 days';
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to automatically set expiration date on exchange rate history records
DROP TRIGGER IF EXISTS set_expiration_trigger ON exchange_rate_history;
CREATE TRIGGER set_expiration_trigger
  BEFORE INSERT ON exchange_rate_history
  FOR EACH ROW
  EXECUTE FUNCTION set_expiration_date();

-- Create a function to update currency pair popularity based on usage
CREATE OR REPLACE FUNCTION update_currency_pair_popularity()
RETURNS VOID AS $$
BEGIN
  UPDATE currency_pairs 
  SET popularity_score = subquery.request_count,
      updated_at = NOW()
  FROM (
    SELECT 
      sender_country as from_country,
      recipient_country as to_country,
      COUNT(*) as request_count
    FROM api_usage_logs 
    WHERE requested_at >= NOW() - INTERVAL '30 days'
      AND sender_country IS NOT NULL 
      AND recipient_country IS NOT NULL
    GROUP BY sender_country, recipient_country
  ) AS subquery
  WHERE currency_pairs.from_country = subquery.from_country
    AND currency_pairs.to_country = subquery.to_country;
END;
$$ LANGUAGE plpgsql;

-- Create a function to generate daily platform performance summaries
CREATE OR REPLACE FUNCTION generate_daily_summary()
RETURNS VOID AS $$
DECLARE
  summary_date DATE := CURRENT_DATE - INTERVAL '1 day';
BEGIN
  -- Update system health metrics
  INSERT INTO system_health (platform_name, is_available, uptime_percentage, average_response_time)
  SELECT 
    platform_name,
    (successful_requests::float / NULLIF(total_requests, 0)) > 0.95 as is_available,
    (successful_requests::float / NULLIF(total_requests, 0)) * 100 as uptime_percentage,
    average_response_time
  FROM platform_performance 
  WHERE date = summary_date
  ON CONFLICT (platform_name) 
  DO UPDATE SET
    is_available = EXCLUDED.is_available,
    uptime_percentage = EXCLUDED.uptime_percentage,
    average_response_time = EXCLUDED.average_response_time,
    last_checked = NOW(),
    updated_at = NOW();
    
  -- Clean up old API usage logs (keep only 90 days)
  DELETE FROM api_usage_logs 
  WHERE requested_at < NOW() - INTERVAL '90 days';
  
  -- Update currency pair popularity
  PERFORM update_currency_pair_popularity();
END;
$$ LANGUAGE plpgsql;

-- Create indexes to optimise query performance
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_api_logs_requested_at 
ON api_usage_logs (requested_at);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_exchange_rate_expires_at 
ON exchange_rate_history (expires_at);

-- Create a view for easy access to current exchange rate data
CREATE OR REPLACE VIEW current_exchange_rates AS
SELECT 
  erh.sender_country,
  erh.recipient_country,
  erh.sender_currency,
  erh.recipient_currency,
  erh.amount,
  erh.official_rate,
  erh.platform_data,
  erh.winner_platform,
  erh.best_receive_amount,
  erh.created_at,
  cp.popularity_score
FROM exchange_rate_history erh
JOIN currency_pairs cp ON (
  erh.sender_country = cp.from_country 
  AND erh.recipient_country = cp.to_country
)
WHERE erh.created_at >= CURRENT_DATE
  AND erh.expires_at > NOW()
ORDER BY erh.created_at DESC;

-- Create a view for platform leaderboards
CREATE OR REPLACE VIEW platform_leaderboard AS
SELECT 
  platform_name,
  sender_country,
  recipient_country,
  times_winner,
  total_requests,
  (successful_requests::float / NULLIF(total_requests, 0)) * 100 as success_rate,
  average_response_time,
  average_rank,
  date
FROM platform_performance
WHERE date >= CURRENT_DATE - INTERVAL '30 days'
ORDER BY times_winner DESC, success_rate DESC, average_response_time ASC;

-- Grant necessary permissions to application user (using environment variable)
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO :"app_user";
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO :"app_user";
GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA public TO :"app_user";

-- Grant permissions on views
GRANT SELECT ON current_exchange_rates TO :"app_user";
GRANT SELECT ON platform_leaderboard TO :"app_user";

-- Ensure all future tables, sequences, and functions also grant privileges
ALTER DEFAULT PRIVILEGES IN SCHEMA public
GRANT ALL PRIVILEGES ON TABLES TO :"app_user";

ALTER DEFAULT PRIVILEGES IN SCHEMA public
GRANT ALL PRIVILEGES ON SEQUENCES TO :"app_user";

ALTER DEFAULT PRIVILEGES IN SCHEMA public
GRANT EXECUTE ON FUNCTIONS TO :"app_user";

-- Confirmation message
DO $$
BEGIN
   RAISE NOTICE '✅ Database triggers, functions, and indexes created successfully';
   RAISE NOTICE '✅ Privileges granted to application user';
END
$$;

-- To run this script, use:
-- psql -U your_username -d your_database -v app_user='my_actual_user' -f "src/scripts/003_create_triggers_and_jobs.sql"

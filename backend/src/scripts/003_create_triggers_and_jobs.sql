-- Create triggers and scheduled jobs for database maintenance
-- This script sets up automated database maintenance tasks

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

-- Create indexes for performance optimization
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_api_logs_cleanup 
ON api_usage_logs (requested_at) 
WHERE requested_at < NOW() - INTERVAL '90 days';

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_exchange_rate_ttl 
ON exchange_rate_history (expires_at) 
WHERE expires_at < NOW();

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

-- Grant necessary permissions (adjust based on your user setup)
-- GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO remitips_api_user;
-- GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO remitips_api_user;
-- GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA public TO remitips_api_user;

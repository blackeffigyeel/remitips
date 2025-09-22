-- Create RemiTips database and setup initial configuration
-- This script should be run by a database administrator

-- Create database (if not exists)
-- CREATE DATABASE remitips;

-- Connect to the remitips database
-- \c remitips;

-- Create extensions for better performance and functionality
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm"; -- For text search optimization

-- Create custom types for better data integrity
CREATE TYPE currency_code AS ENUM (
  'USD', 'EUR', 'GBP', 'CAD', 'AUD', 'JPY', 'CHF', 'CNY', 'INR',
  'NGN', 'KES', 'GHS', 'ZAR', 'EGP', 'MAD', 'TND', 'DZD',
  'MXN', 'BRL', 'ARS', 'CLP', 'COP', 'PEN', 'UYU',
  'PHP', 'THB', 'VND', 'IDR', 'MYR', 'SGD', 'KRW',
  'RUB', 'PLN', 'CZK', 'HUF', 'RON', 'BGN', 'HRK',
  'TRY', 'ILS', 'SAR', 'AED', 'QAR', 'KWD', 'BHD', 'OMR'
);

CREATE TYPE country_code AS ENUM (
  'US', 'CA', 'MX', 'BR', 'AR', 'CL', 'CO', 'PE', 'UY',
  'GB', 'DE', 'FR', 'IT', 'ES', 'NL', 'BE', 'AT', 'CH', 'SE', 'NO', 'DK', 'FI',
  'PL', 'CZ', 'HU', 'RO', 'BG', 'HR', 'SI', 'SK', 'LT', 'LV', 'EE',
  'RU', 'UA', 'BY', 'MD', 'GE', 'AM', 'AZ', 'KZ', 'UZ', 'KG', 'TJ', 'TM',
  'CN', 'JP', 'KR', 'IN', 'PK', 'BD', 'LK', 'NP', 'BT', 'MV',
  'TH', 'VN', 'PH', 'ID', 'MY', 'SG', 'BN', 'KH', 'LA', 'MM',
  'AU', 'NZ', 'FJ', 'PG', 'SB', 'VU', 'NC', 'PF',
  'NG', 'KE', 'GH', 'ZA', 'EG', 'MA', 'TN', 'DZ', 'LY', 'SD', 'ET', 'UG', 'TZ', 'RW', 'BI'
);

-- Function to automatically set expiration date (60 days from creation)
CREATE OR REPLACE FUNCTION set_expiration_date()
RETURNS TRIGGER AS $$
BEGIN
  NEW.expires_at = NEW.created_at + INTERVAL '60 days';
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Function to clean up expired records
CREATE OR REPLACE FUNCTION cleanup_expired_records()
RETURNS INTEGER AS $$
DECLARE
  deleted_count INTEGER;
BEGIN
  DELETE FROM exchange_rate_history WHERE expires_at < NOW();
  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  
  -- Log the cleanup operation
  INSERT INTO api_usage_logs (endpoint, method, status_code, response_time, requested_at)
  VALUES ('cleanup_expired_records', 'SYSTEM', 200, 0, NOW());
  
  RETURN deleted_count;
END;
$$ LANGUAGE plpgsql;

-- Create indexes for better query performance
-- These will be created automatically by Prisma, but we can add custom ones here

-- Composite indexes for common query patterns
CREATE INDEX IF NOT EXISTS idx_exchange_rate_corridor_date 
ON exchange_rate_history (sender_country, recipient_country, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_platform_performance_ranking 
ON platform_performance (sender_country, recipient_country, date DESC, average_rank);

-- Partial indexes for active records only
CREATE INDEX IF NOT EXISTS idx_active_currency_pairs 
ON currency_pairs (from_country, to_country) WHERE is_active = true;

-- GIN index for JSON data in platform_data
CREATE INDEX IF NOT EXISTS idx_platform_data_gin 
ON exchange_rate_history USING GIN (platform_data);

-- Function to update platform performance metrics
CREATE OR REPLACE FUNCTION update_platform_performance(
  p_platform_name VARCHAR(50),
  p_sender_country VARCHAR(3),
  p_recipient_country VARCHAR(3),
  p_success BOOLEAN,
  p_response_time INTEGER,
  p_is_winner BOOLEAN DEFAULT FALSE,
  p_rank INTEGER DEFAULT NULL
)
RETURNS VOID AS $$
BEGIN
  INSERT INTO platform_performance (
    platform_name, sender_country, recipient_country, date,
    total_requests, successful_requests, failed_requests,
    average_response_time, times_winner, average_rank
  )
  VALUES (
    p_platform_name, p_sender_country, p_recipient_country, CURRENT_DATE,
    1, 
    CASE WHEN p_success THEN 1 ELSE 0 END,
    CASE WHEN p_success THEN 0 ELSE 1 END,
    p_response_time,
    CASE WHEN p_is_winner THEN 1 ELSE 0 END,
    p_rank
  )
  ON CONFLICT (platform_name, sender_country, recipient_country, date)
  DO UPDATE SET
    total_requests = platform_performance.total_requests + 1,
    successful_requests = platform_performance.successful_requests + 
      CASE WHEN p_success THEN 1 ELSE 0 END,
    failed_requests = platform_performance.failed_requests + 
      CASE WHEN p_success THEN 0 ELSE 1 END,
    average_response_time = (
      COALESCE(platform_performance.average_response_time, 0) * 
      (platform_performance.total_requests - 1) + p_response_time
    ) / platform_performance.total_requests,
    times_winner = platform_performance.times_winner + 
      CASE WHEN p_is_winner THEN 1 ELSE 0 END,
    average_rank = CASE 
      WHEN p_rank IS NOT NULL THEN (
        COALESCE(platform_performance.average_rank, 0) * 
        (platform_performance.total_requests - 1) + p_rank
      ) / platform_performance.total_requests
      ELSE platform_performance.average_rank
    END,
    updated_at = NOW();
END;
$$ LANGUAGE plpgsql;

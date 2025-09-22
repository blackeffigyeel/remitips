-- Seed the database with popular currency pairs and their metadata
-- This script populates the currency_pairs table with commonly used corridors

INSERT INTO currency_pairs ("from_country", "to_country", "from_currency", "to_currency", "supported_platforms", "popularity_score", "is_active") VALUES
-- North America to Africa
('US', 'NG', 'USD', 'NGN', ARRAY['Wise', 'Remitly', 'MoneyGram', 'WorldRemit', 'XE', 'Ria'], 95, true),
('US', 'KE', 'USD', 'KES', ARRAY['Wise', 'Remitly', 'MoneyGram', 'WorldRemit', 'XE'], 85, true),
('US', 'GH', 'USD', 'GHS', ARRAY['Wise', 'Remitly', 'MoneyGram', 'WorldRemit'], 80, true),
('US', 'ZA', 'USD', 'ZAR', ARRAY['Wise', 'MoneyGram', 'WorldRemit', 'XE'], 75, true),
('CA', 'NG', 'CAD', 'NGN', ARRAY['Wise', 'Remitly', 'MoneyGram', 'WorldRemit'], 70, true),

-- North America to Asia
('US', 'PH', 'USD', 'PHP', ARRAY['Wise', 'Remitly', 'MoneyGram', 'WorldRemit', 'XE'], 90, true),
('US', 'IN', 'USD', 'INR', ARRAY['Wise', 'Remitly', 'MoneyGram', 'WorldRemit', 'XE'], 88, true),
('US', 'CN', 'USD', 'CNY', ARRAY['Wise', 'MoneyGram', 'XE'], 65, true),
('CA', 'PH', 'CAD', 'PHP', ARRAY['Wise', 'Remitly', 'MoneyGram'], 60, true),

-- North America to Latin America
('US', 'MX', 'USD', 'MXN', ARRAY['Wise', 'Remitly', 'MoneyGram', 'WorldRemit', 'Revolut', 'XE', 'Ria'], 100, true),
('US', 'BR', 'USD', 'BRL', ARRAY['Wise', 'Remitly', 'MoneyGram', 'WorldRemit'], 75, true),
('US', 'CO', 'USD', 'COP', ARRAY['Wise', 'Remitly', 'MoneyGram', 'Ria'], 70, true),
('US', 'PE', 'USD', 'PEN', ARRAY['Wise', 'MoneyGram', 'Ria'], 65, true),

-- Europe to Africa
('GB', 'NG', 'GBP', 'NGN', ARRAY['Wise', 'MoneyGram', 'WorldRemit', 'XE'], 85, true),
('GB', 'KE', 'GBP', 'KES', ARRAY['Wise', 'MoneyGram', 'WorldRemit'], 70, true),
('GB', 'GH', 'GBP', 'GHS', ARRAY['Wise', 'MoneyGram', 'WorldRemit'], 65, true),
('DE', 'NG', 'EUR', 'NGN', ARRAY['Wise', 'MoneyGram', 'WorldRemit'], 60, true),

-- Europe to Asia
('GB', 'IN', 'GBP', 'INR', ARRAY['Wise', 'MoneyGram', 'WorldRemit', 'XE'], 80, true),
('GB', 'PH', 'GBP', 'PHP', ARRAY['Wise', 'MoneyGram', 'WorldRemit'], 70, true),
('DE', 'IN', 'EUR', 'INR', ARRAY['Wise', 'MoneyGram'], 55, true),

-- Intra-regional pairs
('US', 'CA', 'USD', 'CAD', ARRAY['Wise', 'Revolut', 'XE'], 85, true),
('GB', 'DE', 'GBP', 'EUR', ARRAY['Wise', 'Revolut'], 75, true),
('US', 'GB', 'USD', 'GBP', ARRAY['Wise', 'Revolut', 'XE'], 80, true),

-- Australia/New Zealand corridors
('AU', 'PH', 'AUD', 'PHP', ARRAY['Wise', 'MoneyGram', 'WorldRemit'], 70, true),
('AU', 'IN', 'AUD', 'INR', ARRAY['Wise', 'MoneyGram'], 65, true),
('NZ', 'PH', 'NZD', 'PHP', ARRAY['Wise', 'MoneyGram'], 55, true),

-- Middle East corridors
('AE', 'IN', 'AED', 'INR', ARRAY['MoneyGram', 'XE'], 75, true),
('AE', 'PH', 'AED', 'PHP', ARRAY['MoneyGram', 'XE'], 70, true),
('SA', 'IN', 'SAR', 'INR', ARRAY['MoneyGram'], 65, true),

-- Less common but supported pairs
('US', 'EG', 'USD', 'EGP', ARRAY['MoneyGram', 'Ria'], 45, true),
('US', 'MA', 'USD', 'MAD', ARRAY['MoneyGram', 'Ria'], 40, true),
('CA', 'IN', 'CAD', 'INR', ARRAY['Wise', 'Remitly'], 50, true),
('GB', 'ZA', 'GBP', 'ZAR', ARRAY['Wise', 'MoneyGram'], 55, true)

ON CONFLICT ("from_country", "to_country") DO NOTHING;

-- Update last official rates with sample data (these will be updated by the API)
UPDATE currency_pairs SET 
  last_official_rate = CASE 
    WHEN from_currency = 'USD' AND to_currency = 'NGN' THEN 1580.50
    WHEN from_currency = 'USD' AND to_currency = 'MXN' THEN 18.25
    WHEN from_currency = 'USD' AND to_currency = 'PHP' THEN 56.80
    WHEN from_currency = 'USD' AND to_currency = 'INR' THEN 83.25
    WHEN from_currency = 'GBP' AND to_currency = 'NGN' THEN 1950.75
    WHEN from_currency = 'EUR' AND to_currency = 'NGN' THEN 1720.30
    WHEN from_currency = 'USD' AND to_currency = 'CAD' THEN 1.35
    WHEN from_currency = 'USD' AND to_currency = 'GBP' THEN 0.79
    ELSE 1.0
  END,
  last_updated = NOW()
WHERE last_official_rate IS NULL;

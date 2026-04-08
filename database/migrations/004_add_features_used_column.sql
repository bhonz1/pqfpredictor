-- Migration: Add features_used column to pqf_predictions table
-- Created: 2024-04-07

-- Add the missing features_used column
ALTER TABLE pqf_predictions ADD COLUMN IF NOT EXISTS features_used TEXT;

-- Update the schema cache comment
COMMENT ON COLUMN pqf_predictions.features_used IS 'Stores the features used for prediction (first 500 chars of skills or activities)';

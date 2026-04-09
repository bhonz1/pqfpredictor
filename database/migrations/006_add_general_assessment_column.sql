-- Migration: Add general_assessment column to pqf_predictions table
-- Created: 2024-04-09

-- Add the general_assessment column to store AI/LLM assessment comments
ALTER TABLE pqf_predictions ADD COLUMN IF NOT EXISTS general_assessment TEXT;

-- Update the schema cache comment
COMMENT ON COLUMN pqf_predictions.general_assessment IS 'Stores the LLM/AI generated assessment comment about student activities';

-- Create index for efficient retrieval
CREATE INDEX IF NOT EXISTS idx_predictions_assessment ON pqf_predictions(general_assessment) WHERE general_assessment IS NOT NULL;

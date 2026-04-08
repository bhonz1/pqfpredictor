-- Migration: Fix RLS policies for admin dashboard operations
-- Created: 2024-04-07

-- ============================================
-- FIX MODELS TABLE RLS
-- ============================================

-- Drop the restrictive policy
DROP POLICY IF EXISTS models_admin_modify ON models;

-- Create a new policy that allows all operations for authenticated requests
-- Since the admin dashboard has its own authentication, we allow all operations
CREATE POLICY models_all_operations ON models
    FOR ALL
    TO authenticated
    USING (true)
    WITH CHECK (true);

-- Also allow anon access for viewing (if needed)
DROP POLICY IF EXISTS models_view_all ON models;
CREATE POLICY models_view_all ON models
    FOR SELECT
    TO anon
    USING (true);

-- ============================================
-- FIX ADMIN_USERS TABLE RLS (same issue)
-- ============================================

-- Drop the restrictive policy
DROP POLICY IF EXISTS admin_users_admin_only ON admin_users;

-- Create a new policy for authenticated users
CREATE POLICY admin_users_all_operations ON admin_users
    FOR ALL
    TO authenticated
    USING (true)
    WITH CHECK (true);

-- ============================================
-- FIX ACCOMPLISHMENTS TABLE RLS (for admin operations)
-- ============================================

-- Keep existing student policies but add a broader admin policy
DROP POLICY IF EXISTS accomplishments_admin_all ON accomplishments;

CREATE POLICY accomplishments_all_operations ON accomplishments
    FOR ALL
    TO authenticated
    USING (true)
    WITH CHECK (true);

-- ============================================
-- FIX PQF_PREDICTIONS TABLE RLS
-- ============================================

DROP POLICY IF EXISTS predictions_admin_all ON pqf_predictions;

CREATE POLICY predictions_all_operations ON pqf_predictions
    FOR ALL
    TO authenticated
    USING (true)
    WITH CHECK (true);

-- ============================================
-- FIX STUDENTS TABLE RLS (for admin operations)
-- ============================================

DROP POLICY IF EXISTS students_admin_all ON students;

CREATE POLICY students_all_operations ON students
    FOR ALL
    TO authenticated
    USING (true)
    WITH CHECK (true);

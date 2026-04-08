-- Migration: Create RLS Policies for All Tables
-- Created: 2024-04-08
-- Description: Comprehensive RLS policies for all tables in the PQF Predictor database

-- ============================================
-- ENABLE RLS ON ALL TABLES
-- ============================================

ALTER TABLE students ENABLE ROW LEVEL SECURITY;
ALTER TABLE accomplishments ENABLE ROW LEVEL SECURITY;
ALTER TABLE pqf_predictions ENABLE ROW LEVEL SECURITY;
ALTER TABLE models ENABLE ROW LEVEL SECURITY;
ALTER TABLE admin_users ENABLE ROW LEVEL SECURITY;

-- ============================================
-- STUDENTS TABLE POLICIES
-- ============================================

-- Drop existing policies to avoid conflicts
DROP POLICY IF EXISTS students_all_operations ON students;
DROP POLICY IF EXISTS students_admin_all ON students;
DROP POLICY IF EXISTS students_view_own ON students;
DROP POLICY IF EXISTS students_update_own ON students;

-- Allow all operations (for service role/admin access)
-- This allows the admin dashboard to manage all students
CREATE POLICY students_all_operations ON students
    FOR ALL
    TO anon, authenticated
    USING (true)
    WITH CHECK (true);

-- ============================================
-- ACCOMPLISHMENTS TABLE POLICIES
-- ============================================

-- Drop existing policies
DROP POLICY IF EXISTS accomplishments_all_operations ON accomplishments;
DROP POLICY IF EXISTS accomplishments_admin_all ON accomplishments;
DROP POLICY IF EXISTS accomplishments_view_own ON accomplishments;
DROP POLICY IF EXISTS accomplishments_insert_own ON accomplishments;
DROP POLICY IF EXISTS accomplishments_update_own ON accomplishments;
DROP POLICY IF EXISTS accomplishments_delete_own ON accomplishments;

-- Allow all operations
CREATE POLICY accomplishments_all_operations ON accomplishments
    FOR ALL
    TO anon, authenticated
    USING (true)
    WITH CHECK (true);

-- ============================================
-- PQF_PREDICTIONS TABLE POLICIES
-- ============================================

-- Drop existing policies
DROP POLICY IF EXISTS predictions_all_operations ON pqf_predictions;
DROP POLICY IF EXISTS predictions_admin_all ON pqf_predictions;
DROP POLICY IF EXISTS predictions_view_own ON pqf_predictions;

-- Allow all operations
CREATE POLICY predictions_all_operations ON pqf_predictions
    FOR ALL
    TO anon, authenticated
    USING (true)
    WITH CHECK (true);

-- ============================================
-- MODELS TABLE POLICIES
-- ============================================

-- Drop existing policies
DROP POLICY IF EXISTS models_all_operations ON models;
DROP POLICY IF EXISTS models_admin_modify ON models;
DROP POLICY IF EXISTS models_view_all ON models;

-- Allow all operations
CREATE POLICY models_all_operations ON models
    FOR ALL
    TO anon, authenticated
    USING (true)
    WITH CHECK (true);

-- ============================================
-- ADMIN_USERS TABLE POLICIES
-- ============================================

-- Drop existing policies
DROP POLICY IF EXISTS admin_users_all_operations ON admin_users;
DROP POLICY IF EXISTS admin_users_admin_only ON admin_users;

-- Allow all operations
CREATE POLICY admin_users_all_operations ON admin_users
    FOR ALL
    TO anon, authenticated
    USING (true)
    WITH CHECK (true);

-- ============================================
-- NOTES
-- ============================================
-- These policies are permissive and allow all operations for both
-- anonymous and authenticated users. This is suitable for:
-- 1. Development environments
-- 2. Applications using service role keys
-- 3. When application-level authentication is handled separately
--
-- For production with stricter security, consider:
-- 1. Using Supabase Auth with JWT-based policies
-- 2. Restricting access based on user roles
-- 3. Enabling specific policies per user type

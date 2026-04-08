-- Quick Fix: Disable RLS on tables for admin dashboard operations
-- Run this in Supabase SQL Editor if you're getting RLS policy violations

-- Disable RLS on models table (allows all operations)
ALTER TABLE models DISABLE ROW LEVEL SECURITY;

-- Disable RLS on admin_users table
ALTER TABLE admin_users DISABLE ROW LEVEL SECURITY;

-- Disable RLS on students table
ALTER TABLE students DISABLE ROW LEVEL SECURITY;

-- Disable RLS on accomplishments table
ALTER TABLE accomplishments DISABLE ROW LEVEL SECURITY;

-- Disable RLS on pqf_predictions table
ALTER TABLE pqf_predictions DISABLE ROW LEVEL SECURITY;

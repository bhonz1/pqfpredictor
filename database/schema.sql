-- PQF Predictor Database Schema
-- Database: pqfpredictor

-- Students Table
CREATE TABLE students (
    id SERIAL PRIMARY KEY,
    student_id VARCHAR(20) UNIQUE NOT NULL,
    fullname VARCHAR(100) NOT NULL,
    course VARCHAR(100) NOT NULL,
    institution VARCHAR(100) NOT NULL,
    password VARCHAR(255) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Accomplishments Table (for OJT accomplishments)
CREATE TABLE accomplishments (
    id SERIAL PRIMARY KEY,
    student_id VARCHAR(20) NOT NULL REFERENCES students(student_id) ON DELETE CASCADE,
    week_number INTEGER NOT NULL CHECK (week_number BETWEEN 1 AND 52),
    month VARCHAR(20) NOT NULL,
    performed_activities TEXT NOT NULL,
    skills_gained TEXT NOT NULL,
    hours_rendered INTEGER NOT NULL CHECK (hours_rendered BETWEEN 0 AND 168),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- PQF Predictions Table
CREATE TABLE pqf_predictions (
    id SERIAL PRIMARY KEY,
    student_id VARCHAR(20) NOT NULL REFERENCES students(student_id) ON DELETE CASCADE,
    predicted_level INTEGER NOT NULL CHECK (predicted_level BETWEEN 1 AND 7),
    confidence_score DECIMAL(5,2),
    total_hours INTEGER,
    model_used VARCHAR(100),
    input_type VARCHAR(50), -- 'performed_activities' or 'skills_gained'
    features_used TEXT, -- Stores the features used for prediction (first 500 chars)
    general_assessment TEXT, -- Stores the LLM/AI generated assessment comment
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ML Models Table
CREATE TABLE models (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    filename VARCHAR(255) NOT NULL,
    model_type VARCHAR(50) NOT NULL,
    file_size VARCHAR(20),
    is_loaded BOOLEAN DEFAULT FALSE,
    upload_date DATE DEFAULT CURRENT_DATE,
    file_path VARCHAR(500),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Admin Users Table
CREATE TABLE admin_users (
    id SERIAL PRIMARY KEY,
    username VARCHAR(50) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    fullname VARCHAR(100),
    role VARCHAR(20) DEFAULT 'admin',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for performance
CREATE INDEX idx_students_student_id ON students(student_id);
CREATE INDEX idx_accomplishments_student_id ON accomplishments(student_id);
CREATE INDEX idx_predictions_student_id ON pqf_predictions(student_id);

-- Note: Valid courses are:
--   - BS Information Technology
--   - BS Computer Science
--   - BS Information Systems

-- Sample data (optional - for testing)
-- INSERT INTO students (student_id, fullname, course, institution, password) VALUES
-- ('2024001', 'John Doe', 'BS Information Technology', 'University of the Philippines', 'password123'),
-- ('2024002', 'Jane Smith', 'BS Computer Science', 'University of the Philippines', 'password123');

-- Sample accomplishments data
-- INSERT INTO accomplishments (student_id, week_number, month, performed_activities, skills_gained, hours_rendered) VALUES
-- ('2024001', 1, 'January', 'System setup and environment configuration', 'Git version control, IDE setup', 40),
-- ('2024001', 2, 'January', 'Database design and schema creation', 'SQL, Database normalization', 45),
-- ('2024002', 1, 'February', 'Frontend component development', 'React, Tailwind CSS', 42);

-- Sample models data (WEKA .model files)
-- INSERT INTO models (name, filename, model_type, file_size, is_loaded, file_path) VALUES
-- ('PQF Level Predictor v1', 'pqf_predictor_v1.model', 'WEKA Random Forest', '2.4 MB', TRUE, '/models/pqf_predictor_v1.model'),
-- ('PQF Level Predictor v2', 'pqf_predictor_v2.model', 'WEKA SVM', '1.8 MB', FALSE, '/models/pqf_predictor_v2.model');

-- Note: In production, passwords should be hashed using bcrypt or similar

-- ============================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ============================================

-- Create roles first (these may error if already exist - that's ok)
-- Run these separately if needed:
--   CREATE ROLE admin;
--   CREATE ROLE app_student;
--   GRANT USAGE ON SCHEMA public TO admin, app_student;
--   GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO admin;

-- Enable RLS on tables
ALTER TABLE students ENABLE ROW LEVEL SECURITY;
ALTER TABLE accomplishments ENABLE ROW LEVEL SECURITY;
ALTER TABLE pqf_predictions ENABLE ROW LEVEL SECURITY;
ALTER TABLE models ENABLE ROW LEVEL SECURITY;
ALTER TABLE admin_users ENABLE ROW LEVEL SECURITY;

-- ============================================
-- STUDENTS TABLE POLICIES
-- ============================================

-- Policy: Students can view their own record
CREATE POLICY students_view_own ON students
    FOR SELECT
    USING (student_id = current_setting('app.current_student_id', true));

-- Policy: Students can update their own record (except student_id)
CREATE POLICY students_update_own ON students
    FOR UPDATE
    USING (student_id = current_setting('app.current_student_id', true));

-- Policy: Admins can view all students (postgres user or app admin flag)
CREATE POLICY students_admin_all ON students
    FOR ALL
    USING (
        current_user IN ('postgres', 'admin', 'supabase_admin')
        OR current_setting('app.is_admin', true) = 'true'
    )
    WITH CHECK (
        current_user IN ('postgres', 'admin', 'supabase_admin')
        OR current_setting('app.is_admin', true) = 'true'
    );

-- ============================================
-- ACCOMPLISHMENTS TABLE POLICIES
-- ============================================

-- Policy: Students can view their own accomplishments
CREATE POLICY accomplishments_view_own ON accomplishments
    FOR SELECT
    USING (student_id = current_setting('app.current_student_id', true));

-- Policy: Students can insert their own accomplishments
CREATE POLICY accomplishments_insert_own ON accomplishments
    FOR INSERT
    WITH CHECK (student_id = current_setting('app.current_student_id', true));

-- Policy: Students can update their own accomplishments
CREATE POLICY accomplishments_update_own ON accomplishments
    FOR UPDATE
    USING (student_id = current_setting('app.current_student_id', true));

-- Policy: Students can delete their own accomplishments
CREATE POLICY accomplishments_delete_own ON accomplishments
    FOR DELETE
    USING (student_id = current_setting('app.current_student_id', true));

-- Policy: Admins can manage all accomplishments
CREATE POLICY accomplishments_admin_all ON accomplishments
    FOR ALL
    USING (
        current_user IN ('postgres', 'admin', 'supabase_admin')
        OR current_setting('app.is_admin', true) = 'true'
    )
    WITH CHECK (
        current_user IN ('postgres', 'admin', 'supabase_admin')
        OR current_setting('app.is_admin', true) = 'true'
    );

-- ============================================
-- PQF PREDICTIONS TABLE POLICIES
-- ============================================

-- Policy: Students can view their own predictions
CREATE POLICY predictions_view_own ON pqf_predictions
    FOR SELECT
    USING (student_id = current_setting('app.current_student_id', true));

-- Policy: Admins can manage all predictions
CREATE POLICY predictions_admin_all ON pqf_predictions
    FOR ALL
    USING (
        current_user IN ('postgres', 'admin', 'supabase_admin')
        OR current_setting('app.is_admin', true) = 'true'
    )
    WITH CHECK (
        current_user IN ('postgres', 'admin', 'supabase_admin')
        OR current_setting('app.is_admin', true) = 'true'
    );

-- ============================================
-- MODELS TABLE POLICIES
-- ============================================

-- Policy: Anyone can view models (read-only for students)
CREATE POLICY models_view_all ON models
    FOR SELECT
    USING (true);

-- Policy: Only admins can modify models
CREATE POLICY models_admin_modify ON models
    FOR ALL
    USING (
        current_user IN ('postgres', 'admin', 'supabase_admin')
        OR current_setting('app.is_admin', true) = 'true'
    )
    WITH CHECK (
        current_user IN ('postgres', 'admin', 'supabase_admin')
        OR current_setting('app.is_admin', true) = 'true'
    );

-- ============================================
-- ADMIN USERS TABLE POLICIES
-- ============================================

-- Policy: Only admins can view admin users
CREATE POLICY admin_users_admin_only ON admin_users
    FOR ALL
    USING (
        current_user IN ('postgres', 'admin', 'supabase_admin')
        OR current_setting('app.is_admin', true) = 'true'
    )
    WITH CHECK (
        current_user IN ('postgres', 'admin', 'supabase_admin')
        OR current_setting('app.is_admin', true) = 'true'
    );

-- ============================================
-- USAGE NOTES
-- ============================================
-- 
-- To use RLS with application layer:
-- 
-- 1. Set the student context before queries:
--    SET LOCAL app.current_student_id = '2024001';
--
-- 2. For admin access, set admin flag:
--    SET LOCAL app.is_admin = 'true';
--
-- 3. Or use JWT claims in Supabase/PostgREST:
--    CREATE POLICY students_jwt ON students
--        FOR SELECT
--        USING (student_id = (current_setting('request.jwt.claims', true)::json->>'student_id'));
--
-- 4. For Supabase Auth integration:
--    CREATE POLICY students_supabase ON students
--        FOR SELECT
--        USING (auth.uid() = user_id); -- if you have a user_id UUID column
--
-- ============================================

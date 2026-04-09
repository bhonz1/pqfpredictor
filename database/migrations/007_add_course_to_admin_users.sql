-- Migration: Add course column to admin_users table for course-based access control
-- Created: 2024-04-09

-- Add the course column to admin_users table
ALTER TABLE admin_users ADD COLUMN IF NOT EXISTS course VARCHAR(100);

-- Update the schema cache comment
COMMENT ON COLUMN admin_users.course IS 'Course assigned to admin for filtering student access. NULL = all courses (superadmin)';

-- Insert/update superadmin Beast (can see all courses)
INSERT INTO admin_users (username, password, fullname, role, course)
VALUES ('Beast', 'admin123', 'Super Administrator', 'superadmin', NULL)
ON CONFLICT (username) DO UPDATE 
SET role = 'superadmin', course = NULL;

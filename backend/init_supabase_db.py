#!/usr/bin/env python3
"""
Database initialization script for PostgreSQL (Supabase)
Run this after connecting to Supabase to create tables and seed data
"""
import os
import sys

# Add parent directory to path
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app import app, seed_default_admin, auto_load_model
from models.database_models import db

def init_supabase_database():
    """Initialize database tables and seed data for Supabase PostgreSQL"""
    with app.app_context():
        print("Creating database tables...")
        db.create_all()
        print("✓ Tables created successfully")
        
        print("\nSeeding default admin user...")
        seed_default_admin()
        print("✓ Admin user created")
        
        print("\nAuto-loading model...")
        auto_load_model()
        print("✓ Model loading complete")
        
        print("\n✅ Database initialization complete!")
        print("\nDefault login credentials:")
        print("  Username: Beast")
        print("  Password: Beast123")

if __name__ == '__main__':
    # Check if DATABASE_URL is set
    if not os.getenv('DATABASE_URL'):
        print("❌ ERROR: DATABASE_URL environment variable is not set")
        print("\nPlease set your Supabase connection URL:")
        print("export DATABASE_URL='postgresql://postgres:[password]@db.[ref].supabase.co:5432/postgres'")
        sys.exit(1)
    
    print("🚀 Initializing Supabase PostgreSQL database...")
    print(f"Database URL: {os.getenv('DATABASE_URL')[:50]}...\n")
    
    try:
        init_supabase_database()
    except Exception as e:
        print(f"\n❌ Error: {e}")
        sys.exit(1)

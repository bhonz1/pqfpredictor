import { createClient } from '@/utils/supabase/server';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const cookieStore = await cookies();
    const supabase = createClient(cookieStore);
    const { username, password } = await request.json();

    if (!username || !password) {
      return NextResponse.json(
        { error: 'Username and password are required' },
        { status: 400 }
      );
    }

    // Query admin from database
    const { data: admin, error } = await supabase
      .from('admin_users')
      .select('id, username, fullname, role, course, password')
      .eq('username', username)
      .single();

    if (error || !admin) {
      return NextResponse.json(
        { error: 'Invalid username or password' },
        { status: 401 }
      );
    }

    // Check password (simple string comparison for now)
    // In production, use bcrypt.compare()
    if (admin.password !== password) {
      return NextResponse.json(
        { error: 'Invalid username or password' },
        { status: 401 }
      );
    }

    // Return admin data (excluding password)
    return NextResponse.json({
      success: true,
      admin: {
        id: admin.id,
        username: admin.username,
        fullname: admin.fullname,
        role: admin.role,
        course: admin.course, // NULL for superadmin (Beast), specific course for others
        isSuperAdmin: admin.username === 'Beast' || admin.role === 'superadmin'
      }
    });

  } catch (error) {
    console.error('Login error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

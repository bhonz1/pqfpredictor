import { type NextRequest, NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/middleware";

export async function middleware(request: NextRequest) {
  const { supabase, response } = createClient(request);

  // If supabase client couldn't be created, just return the response
  if (!supabase) {
    return response;
  }

  // Refresh session if expired - required for Server Components
  // https://supabase.com/docs/guides/auth/server-side/nextjs
  try {
    const { data: { user } } = await supabase.auth.getUser();

    // Optional: Add protected route logic here
    // Example: redirect unauthenticated users from protected pages
    // const protectedPaths = ['/dashboard', '/admin/dashboard'];
    // const isProtected = protectedPaths.some(path => request.nextUrl.pathname.startsWith(path));
    // if (isProtected && !user) {
    //   return NextResponse.redirect(new URL('/login', request.url));
    // }
  } catch (error) {
    console.error("Middleware auth error:", error);
  }

  return response;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};

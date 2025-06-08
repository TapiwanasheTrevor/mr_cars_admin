import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export async function middleware(req: NextRequest) {
  const res = NextResponse.next();
  
  // Get all cookies to check for Supabase auth
  const cookies = req.cookies;
  
  // Look for any Supabase auth-related cookies
  const authCookies = Array.from(cookies.getAll()).filter(cookie => 
    cookie.name.includes('supabase') || 
    cookie.name.includes('sb-') ||
    cookie.name.includes('auth-token')
  );
  
  const isAuthenticated = authCookies.length > 0;

  // Check if the user is authenticated
  if (!isAuthenticated) {
    // If the user is not authenticated and trying to access a protected route
    if (req.nextUrl.pathname.startsWith('/dashboard')) {
      const redirectUrl = new URL('/auth/login', req.url);
      return NextResponse.redirect(redirectUrl);
    }
  } else {
    // If the user is authenticated and trying to access auth pages
    if (req.nextUrl.pathname.startsWith('/auth')) {
      const redirectUrl = new URL('/dashboard', req.url);
      return NextResponse.redirect(redirectUrl);
    }
  }

  return res;
}

export const config = {
  matcher: ['/dashboard/:path*', '/auth/:path*'],
};
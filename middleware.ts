import { NextRequest, NextResponse } from 'next/server';
import { verifyToken } from '@/lib/jwt';

const protectedRoutes = ['/dashboard'];
const authRoutes = ['/login', '/registro'];

export async function proxy(req: NextRequest) {
  const { pathname } = req.nextUrl;
  const token = req.cookies.get('token')?.value;

  const isProtected = protectedRoutes.some((r) => pathname.startsWith(r));
  const isAuth = authRoutes.some((r) => pathname.startsWith(r));

  // 1. CSRF Protection for state-changing methods
  const mutatingMethods = ['POST', 'PUT', 'DELETE', 'PATCH'];
  if (mutatingMethods.includes(req.method)) {
    const origin = req.headers.get('origin');
    const referer = req.headers.get('referer');
    const host = req.headers.get('host') || '';

    const proto = req.headers.get('x-forwarded-proto') || req.nextUrl.protocol.replace(':', '');
    const expectedPrefix = `${proto}://${host}`;

    let isSameOrigin = false;

    if (origin) {
      if (
        origin === expectedPrefix ||
        origin.startsWith(`http://${host}`) ||
        origin.startsWith(`https://${host}`)
      ) {
        isSameOrigin = true;
      }
    } else if (referer) {
      if (
        referer.startsWith(expectedPrefix) ||
        referer.startsWith(`http://${host}`) ||
        referer.startsWith(`https://${host}`)
      ) {
        isSameOrigin = true;
      }
    } else {
      // Allow if both are absent (for non-browser clients or tests)
      isSameOrigin = true;
    }

    if (!isSameOrigin) {
      return new NextResponse(
        JSON.stringify({ error: 'CSRF check failed: invalid or untrusted origin/referer.' }),
        {
          status: 403,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }
  }

  let res = NextResponse.next();

  // 2. Sliding Session Expiration & Route Protection
  if (token) {
    try {
      await verifyToken(token);

      // Token is valid
      if (isAuth) {
        const redirectRes = NextResponse.redirect(new URL('/dashboard', req.url));
        redirectRes.cookies.set('token', token, {
          httpOnly: true,
          secure: process.env.NODE_ENV === 'production',
          sameSite: 'lax',
          path: '/',
          maxAge: 1800, // 30 minutes
        });
        return redirectRes;
      }

      // Slide session on any active request
      res.cookies.set('token', token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        path: '/',
        maxAge: 1800, // 30 minutes
      });
    } catch {
      // Token is invalid
      if (isProtected) {
        const redirectRes = NextResponse.redirect(new URL('/login', req.url));
        redirectRes.cookies.delete('token');
        return redirectRes;
      }
    }
  } else {
    // No token
    if (isProtected) {
      return NextResponse.redirect(new URL('/login', req.url));
    }
  }

  return res;
}

export const config = {
  matcher: [
    '/dashboard/:path*',
    '/login',
    '/registro',
    '/api/:path*',
    '/',
    '/instituciones/:path*',
  ],
};

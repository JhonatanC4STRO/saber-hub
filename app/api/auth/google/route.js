import { NextResponse } from 'next/server';

export async function GET(req) {
  try {
    const origin = req.headers.get('origin') || req.nextUrl?.origin || 'http://localhost:3000';
    const clientId = process.env.CLIENT_ID;

    if (!clientId) {
      console.error('[Google Auth Error] CLIENT_ID no configurado en .env');
      return NextResponse.json(
        { error: 'Google OAuth no configurado en el servidor.' },
        { status: 500 }
      );
    }

    const redirectUri = `${origin}/api/auth/google/callback`;
    const googleAuthUrl =
      `https://accounts.google.com/o/oauth2/v2/auth?` +
      `client_id=${encodeURIComponent(clientId)}&` +
      `redirect_uri=${encodeURIComponent(redirectUri)}&` +
      `response_type=code&` +
      `scope=${encodeURIComponent('openid email profile')}&` +
      `access_type=offline&` +
      `prompt=consent`;

    return NextResponse.redirect(googleAuthUrl);
  } catch (error) {
    console.error('[GET /api/auth/google]', error);
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
}

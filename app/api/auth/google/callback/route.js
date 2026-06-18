import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { signToken } from '@/lib/jwt';

export async function GET(req) {
  try {
    const origin = req.headers.get('origin') || req.nextUrl?.origin || 'http://localhost:3000';
    const code = req.nextUrl.searchParams.get('code');
    const errorParam = req.nextUrl.searchParams.get('error');

    if (errorParam) {
      console.error('[Google Callback Error]', errorParam);
      return NextResponse.redirect(
        `${origin}/login?error=${encodeURIComponent('Cancelado por el usuario o denegado.')}`
      );
    }

    if (!code) {
      return NextResponse.redirect(
        `${origin}/login?error=${encodeURIComponent('No se recibió código de autorización.')}`
      );
    }

    const clientId = process.env.CLIENT_ID;
    const clientSecret = process.env.CLIENT_SECRET;
    const redirectUri = `${origin}/api/auth/google/callback`;

    // Intercambiar el código por tokens en Google
    const tokenRes = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        client_id: clientId,
        client_secret: clientSecret,
        code,
        grant_type: 'authorization_code',
        redirect_uri: redirectUri,
      }),
    });

    const tokenData = await tokenRes.json();

    if (!tokenRes.ok) {
      console.error('[Google Exchange Error]', tokenData);
      return NextResponse.redirect(
        `${origin}/login?error=${encodeURIComponent('Error al autenticar con Google.')}`
      );
    }

    const { id_token } = tokenData;

    if (!id_token) {
      return NextResponse.redirect(
        `${origin}/login?error=${encodeURIComponent('Token no recibido de Google.')}`
      );
    }

    // Decodificar el id_token (JWT) de manera segura
    const tokenParts = id_token.split('.');
    if (tokenParts.length !== 3) {
      return NextResponse.redirect(
        `${origin}/login?error=${encodeURIComponent('Token inválido recibido de Google.')}`
      );
    }

    const payload = JSON.parse(Buffer.from(tokenParts[1], 'base64').toString('utf-8'));

    const { email, name, picture, sub } = payload;

    if (!email) {
      return NextResponse.redirect(
        `${origin}/login?error=${encodeURIComponent('Google no proporcionó un correo electrónico.')}`
      );
    }

    // Verificar si el usuario ya existe por correo
    let usuario = await prisma.usuario.findUnique({
      where: { email },
      include: { rol: true },
    });

    if (usuario) {
      // Actualizar campos de verificación, login e imagen
      usuario = await prisma.usuario.update({
        where: { id: usuario.id },
        data: {
          verificado: true,
          ultimoLogin: new Date(),
          intentosFallidos: 0,
          bloqueadoHasta: null,
          imagen: usuario.imagen || picture || null,
        },
        include: { rol: true },
      });
    } else {
      // Crear nuevo usuario estudiante
      const rol = await prisma.rol.upsert({
        where: { nombre: 'estudiante' },
        update: {},
        create: {
          nombre: 'estudiante',
          descripcion: 'Rol por defecto para nuevos usuarios registrados',
        },
      });

      // Crear documento provisional a partir del sub de Google
      let documentoProvisional = `G-${sub.slice(-8)}`;

      const docExistente = await prisma.usuario.findUnique({
        where: { documento: documentoProvisional },
      });

      if (docExistente) {
        documentoProvisional = `G-${Math.floor(10000000 + Math.random() * 90000000)}`;
      }

      usuario = await prisma.usuario.create({
        data: {
          nombre: name || email.split('@')[0],
          email,
          documento: documentoProvisional,
          passwordHash: '', // Password vacía bloquea inicio por formulario convencional pero permite Google/SSO
          rolId: rol.id,
          verificado: true,
          activo: true,
          ultimoLogin: new Date(),
          imagen: picture || null,
        },
        include: { rol: true },
      });
    }

    // Firmar token del sistema
    const token = await signToken({
      id: usuario.id,
      nombre: usuario.nombre,
      email: usuario.email,
      rol: usuario.rol.nombre,
    });

    // Registrar auditoría de éxito
    await prisma.logAuditoria
      .create({
        data: {
          usuarioId: usuario.id,
          accion: 'ACCESO_EXITOSO_GOOGLE',
          tabla: 'usuarios',
          registroId: usuario.id,
          datosDespues: JSON.stringify({ email: usuario.email, provider: 'google' }),
          ip: '127.0.0.1',
        },
      })
      .catch(() => {});

    // Responder con redirección al dashboard
    const response = NextResponse.redirect(`${origin}/dashboard`);

    response.cookies.set('token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 1800, // 30 minutos
    });

    return response;
  } catch (error) {
    console.error('[Google Callback API Error]', error);
    const origin = req.headers.get('origin') || req.nextUrl?.origin || 'http://localhost:3000';
    return NextResponse.redirect(
      `${origin}/login?error=${encodeURIComponent('Error interno del servidor en Google Auth Callback.')}`
    );
  }
}

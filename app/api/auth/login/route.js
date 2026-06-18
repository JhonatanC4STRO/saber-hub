import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import prisma from '@/lib/prisma';
import { signToken } from '@/lib/jwt';

function getIp(req) {
  return req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || '127.0.0.1';
}

export async function POST(req) {
  try {
    const { email, password } = await req.json();

    if (!email || !password) {
      return NextResponse.json({ error: 'Todos los campos son obligatorios' }, { status: 400 });
    }

    const usuario = await prisma.usuario.findUnique({
      where: { email },
      include: { rol: true },
    });

    if (!usuario) {
      await prisma.logAuditoria
        .create({
          data: {
            accion: 'ACCESO_FALLIDO',
            tabla: 'usuarios',
            datosAntes: JSON.stringify({ email, motivo: 'usuario_no_encontrado' }),
            ip: getIp(req),
          },
        })
        .catch(() => {});
      return NextResponse.json({ error: 'Credenciales inválidas' }, { status: 401 });
    }

    // Verificar si la cuenta está bloqueada temporalmente
    if (usuario.bloqueadoHasta && usuario.bloqueadoHasta > new Date()) {
      const minutosRestantes = Math.ceil((usuario.bloqueadoHasta - new Date()) / (60 * 1000));
      return NextResponse.json(
        {
          error: `Cuenta bloqueada temporalmente por seguridad. Inténtalo de nuevo en ${minutosRestantes} minutos.`,
        },
        { status: 403 }
      );
    }

    if (!usuario.activo) {
      await prisma.logAuditoria
        .create({
          data: {
            usuarioId: usuario.id,
            accion: 'ACCESO_FALLIDO',
            tabla: 'usuarios',
            registroId: usuario.id,
            datosAntes: JSON.stringify({ email, motivo: 'cuenta_desactivada' }),
            ip: getIp(req),
          },
        })
        .catch(() => {});
      return NextResponse.json(
        { error: 'Su cuenta ha sido desactivada. Por favor, contacte al administrador.' },
        { status: 403 }
      );
    }

    const passwordValida = await bcrypt.compare(password, usuario.passwordHash);

    if (!passwordValida) {
      // Incrementar intentos fallidos
      const nuevosIntentos = usuario.intentosFallidos + 1;
      let bloqueadoHasta = usuario.bloqueadoHasta;
      let errorMsg = 'Credenciales inválidas';

      if (nuevosIntentos >= 5) {
        bloqueadoHasta = new Date(Date.now() + 15 * 60 * 1000); // 15 minutos
        await prisma.usuario.update({
          where: { id: usuario.id },
          data: {
            intentosFallidos: 0, // Reiniciamos el contador de intentos al bloquear
            bloqueadoHasta,
          },
        });
        errorMsg =
          'Cuenta bloqueada temporalmente por seguridad. Has excedido los 5 intentos permitidos. Inténtalo de nuevo en 15 minutos.';
      } else {
        await prisma.usuario.update({
          where: { id: usuario.id },
          data: {
            intentosFallidos: nuevosIntentos,
          },
        });
        errorMsg = `Credenciales inválidas. Te quedan ${5 - nuevosIntentos} intentos.`;
      }

      await prisma.logAuditoria
        .create({
          data: {
            usuarioId: usuario.id,
            accion: 'ACCESO_FALLIDO',
            tabla: 'usuarios',
            registroId: usuario.id,
            datosAntes: JSON.stringify({
              email,
              motivo: 'contrasena_incorrecta',
              intentosFallidos: nuevosIntentos,
            }),
            ip: getIp(req),
          },
        })
        .catch(() => {});

      return NextResponse.json({ error: errorMsg }, { status: 401 });
    }

    // Verificar si el correo ha sido verificado
    if (!usuario.verificado) {
      return NextResponse.json(
        {
          error:
            'Debes verificar tu correo electrónico para iniciar sesión. Revisa tu bandeja de entrada.',
        },
        { status: 403 }
      );
    }

    // Login exitoso: reiniciar contadores de bloqueo y actualizar fecha de último login
    await prisma.usuario.update({
      where: { id: usuario.id },
      data: {
        intentosFallidos: 0,
        bloqueadoHasta: null,
        ultimoLogin: new Date(),
      },
    });

    const token = await signToken({
      id: usuario.id,
      nombre: usuario.nombre,
      email: usuario.email,
      rol: usuario.rol.nombre,
    });

    await prisma.logAuditoria
      .create({
        data: {
          usuarioId: usuario.id,
          accion: 'ACCESO_EXITOSO',
          tabla: 'usuarios',
          registroId: usuario.id,
          datosDespues: JSON.stringify({ email, rol: usuario.rol.nombre }),
          ip: getIp(req),
        },
      })
      .catch(() => {});

    const res = NextResponse.json({ message: 'Login exitoso' }, { status: 200 });

    res.cookies.set('token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 1800, // 30 minutos
    });

    return res;
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
}

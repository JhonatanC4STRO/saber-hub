import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { verifyToken } from '@/lib/jwt';
import CrearCurso from '@/components/cursos/crear-curso';

export const metadata = {
  title: 'Crear curso — SABERHUB',
  description: 'Crea un nuevo curso en la plataforma SABERHUB.',
};

export default async function CrearCursosPage() {
  const cookieStore = await cookies();
  const token = cookieStore.get('token')?.value;
  if (!token) {
    redirect('/login');
  }

  let usuario;
  let tokenInvalido = false;
  try {
    usuario = await verifyToken(token);
  } catch {
    tokenInvalido = true;
  }

  if (tokenInvalido) {
    redirect('/login');
  }

  return <CrearCurso usuario={usuario} />;
}

import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { verifyToken } from '@/lib/jwt';
import ModulosEditor from '@/components/cursos/ModulosEditor';

export const metadata = {
  title: 'Módulos y Lecciones — SABERHUB',
  description: 'Organiza los módulos y lecciones de tu curso en SABERHUB.',
};

export default async function CrearCursosModulosPage() {
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

  return <ModulosEditor usuario={usuario} />;
}

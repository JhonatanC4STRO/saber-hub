import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { verifyToken } from '@/lib/jwt';
import PublicarCurso from '@/components/cursos/PublicarCurso';

export const metadata = {
  title: 'Publicar curso — SABERHUB',
  description:
    'Revisa tu curso y publícalo en la plataforma SABERHUB para que los estudiantes puedan acceder.',
};

export default async function PublicarPage() {
  const cookieStore = await cookies();
  const token = cookieStore.get('token')?.value;
  if (!token) redirect('/login');

  let usuario;
  try {
    usuario = await verifyToken(token);
  } catch {
    redirect('/login');
  }

  if (!usuario) redirect('/login');

  return <PublicarCurso usuario={usuario} />;
}

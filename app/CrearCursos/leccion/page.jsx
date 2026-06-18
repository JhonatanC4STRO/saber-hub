import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { verifyToken } from '@/lib/jwt';
import LeccionEditor from '@/components/cursos/LeccionEditor';

export const metadata = {
  title: 'Editor de Lección — SABERHUB',
  description: 'Edita el contenido de una lección en tu curso SABERHUB.',
};

export default async function LeccionEditorPage() {
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

  return <LeccionEditor usuario={usuario} />;
}

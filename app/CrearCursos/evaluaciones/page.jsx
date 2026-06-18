import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { verifyToken } from '@/lib/jwt';
import EvaluacionEditor from '@/components/cursos/EvaluacionEditor';

export const metadata = {
  title: 'Crear Evaluación — SABERHUB',
  description:
    'Configura los parámetros y agrega preguntas para la evaluación de tu curso en SABERHUB.',
};

export default async function CrearEvaluacionPage() {
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

  return <EvaluacionEditor usuario={usuario} />;
}

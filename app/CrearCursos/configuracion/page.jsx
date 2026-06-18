import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { verifyToken } from '@/lib/jwt';
import ConfiguracionEditor from '@/components/cursos/ConfiguracionEditor';

export const metadata = {
  title: 'Configuración del curso — SABERHUB',
  description:
    'Configura las opciones de acceso, certificados y comunicación de tu curso en SABERHUB.',
};

export default async function ConfiguracionPage() {
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

  return <ConfiguracionEditor usuario={usuario} />;
}

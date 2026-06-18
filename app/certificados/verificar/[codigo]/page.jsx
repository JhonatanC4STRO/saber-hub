import { Suspense } from 'react';
import VerificadorCertificado from './VerificadorCertificado';

export const metadata = {
  title: 'Verificar Certificado – SaberHub',
  description: 'Valida la autenticidad de un certificado emitido por SaberHub',
};

export default async function Page({ params }) {
  const { codigo } = await params;
  return (
    <Suspense fallback={<p style={{ textAlign: 'center', padding: '4rem' }}>Verificando…</p>}>
      <VerificadorCertificado codigo={codigo} />
    </Suspense>
  );
}

import React, { Suspense } from 'react';
import CatalogoCursos from '@/components/estudiante/CatalogoCursos';

export const metadata = {
  title: 'Catálogo de Cursos | SABERHUB',
  description:
    'Explora y descubre cursos en línea gratuitos de programación, ciberseguridad, inteligencia artificial y más. Certificados validados por las mejores instituciones de Colombia.',
};

export default function CatalogoPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center">Cargando catálogo...</div>
      }
    >
      <CatalogoCursos />
    </Suspense>
  );
}

import type { Metadata } from 'next';
import { Inter, Geist_Mono } from 'next/font/google';
import { cookies } from 'next/headers';
import AutoLogout from '@/components/AutoLogout';
import './globals.css';

const inter = Inter({
  variable: '--font-inter',
  subsets: ['latin'],
});

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
});

export const metadata: Metadata = {
  title: 'SABERHUB | Learning Platform',
  description:
    'Plataforma colombiana de aprendizaje en linea gratuita para programacion, ciberseguridad, redes e inteligencia artificial.',
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const cookieStore = await cookies();
  const isLoggedIn = cookieStore.has('token');

  return (
    <html
      lang="es-CO"
      className={`${inter.variable} ${geistMono.variable} h-full antialiased`}
      suppressHydrationWarning
    >
      <body className="min-h-full flex flex-col" suppressHydrationWarning>
        {isLoggedIn && <AutoLogout />}
        {children}
      </body>
    </html>
  );
}

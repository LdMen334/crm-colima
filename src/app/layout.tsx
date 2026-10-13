import type { Metadata } from 'next';
import { Onest } from 'next/font/google';
import { Providers } from './providers';
import './globals.css';

// Self-hosted en el build: sin peticiones a Google en tiempo de ejecución.
const onest = Onest({ subsets: ['latin'], variable: '--font-onest', display: 'swap' });

export const metadata: Metadata = {
  title: 'Historias Clínicas · Cruz Roja Mexicana Colima',
  description: 'Historias Clínicas — Coordinación de Servicios Médicos, Delegación Estatal Colima',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es-MX" className={onest.variable}>
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}

import type { Metadata, Viewport } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Suivi des Cartes Scolaires | MFFE Côte d’Ivoire',
  description: 'Plateforme mobile de pilotage et suivi des réceptions et distributions de cartes scolaires du Ministère de la Femme, de la Famille et de l’Enfant.',
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: '#0b1120',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="fr" className="dark">
      <head>
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
      </head>
      <body className="min-h-screen bg-[#0b1120] text-slate-100 selection:bg-orange-500 selection:text-white antialiased">
        {children}
      </body>
    </html>
  );
}

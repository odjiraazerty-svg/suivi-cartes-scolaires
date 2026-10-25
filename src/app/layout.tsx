import type { Metadata, Viewport } from 'next';
import './globals.css';
import { ThemeProvider } from '@/context/ThemeContext';
import ThemeSelectorModal from '@/components/ThemeSelectorModal';
import ThemeToggleButton from '@/components/ThemeToggleButton';

export const metadata: Metadata = {
  title: 'Suivi des Cartes Scolaires | MFFE Côte d’Ivoire',
  description: 'Plateforme mobile de pilotage et suivi des réceptions et distributions de cartes scolaires du Ministère de la Femme, de la Famille et de l’Enfant.',
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: '#070b14',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="fr" className="dark theme-dark" data-theme-mode="dark" data-theme-accent="orange" data-theme-style="glass">
      <head>
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                try {
                  var stored = localStorage.getItem('mffe_theme_preferences');
                  if (stored) {
                    var conf = JSON.parse(stored);
                    var mode = conf.mode || 'dark';
                    if (mode === 'system') {
                      mode = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
                    }
                    document.documentElement.classList.remove('dark', 'light', 'theme-dark', 'theme-light');
                    document.documentElement.classList.add(mode, 'theme-' + mode);
                    document.documentElement.setAttribute('data-theme-mode', mode);
                    if (conf.accent) document.documentElement.setAttribute('data-theme-accent', conf.accent);
                    if (conf.style) document.documentElement.setAttribute('data-theme-style', conf.style);
                    if (conf.preset) document.documentElement.setAttribute('data-theme-preset', conf.preset);
                  }
                } catch (e) {}
              })();
            `,
          }}
        />
      </head>
      <body className="min-h-screen antialiased selection:bg-orange-500 selection:text-white">
        <ThemeProvider>
          {children}
          <ThemeSelectorModal />
          <ThemeToggleButton variant="floating" />
        </ThemeProvider>
      </body>
    </html>
  );
}

import type { Metadata, Viewport } from 'next';
import './fonts.css';
import './globals.css';
import './hub.css';

export const metadata: Metadata = {
  title: 'BANGTAOSTYLE.COM · LIVE',
  applicationName: 'BANGTAOSTYLE',
  manifest: '/manifest.webmanifest',
  // iOS Safari "Add to Home Screen": full-screen app, content runs under the status bar (safe areas in hub.css)
  appleWebApp: { capable: true, title: 'BANGTAOSTYLE', statusBarStyle: 'black-translucent' },
  formatDetection: { telephone: false },
  icons: {
    icon: [{ url: '/app/favicon-32.png', sizes: '32x32', type: 'image/png' }, { url: '/app/icon-192.png', sizes: '192x192', type: 'image/png' }],
    apple: [{ url: '/app/apple-touch-icon.png', sizes: '180x180' }],
  },
  description: 'Кольцо Таиланда в прямом эфире: Пхукет → Самуи → Панган → Чиангмай → Аюттхая → Бангкок → Паттайя → Пхукет',
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  viewportFit: 'cover',
  themeColor: '#0a0b0d',
  colorScheme: 'dark',
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="ru">
      <head>
        {/* older iOS versions only honour the apple- prefixed tag for full-screen home-screen apps */}
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <link rel="preload" href="/fonts/g/unbounded-cyrillic-13.woff2" as="font" type="font/woff2" crossOrigin="anonymous" />
        <link rel="preload" href="/fonts/g/unbounded-latin-15.woff2" as="font" type="font/woff2" crossOrigin="anonymous" />
        <link rel="preload" href="/fonts/g/golos-text-cyrillic-1.woff2" as="font" type="font/woff2" crossOrigin="anonymous" />
      </head>
      <body>{children}</body>
    </html>
  );
}

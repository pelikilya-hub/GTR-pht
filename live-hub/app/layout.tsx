import type { Metadata, Viewport } from 'next';
import './fonts.css';
import './globals.css';
import './hub.css';

export const metadata: Metadata = {
  title: 'BANGTAOSTYLE.COM · LIVE',
  description: 'Кольцо Таиланда в прямом эфире: Пхукет → Самуи → Панган → Чиангмай → Аюттхая → Бангкок → Паттайя → Пхукет',
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  viewportFit: 'cover',
  themeColor: '#0B0B0C',
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="ru">
      <head>
        <link rel="preload" href="/fonts/g/unbounded-cyrillic-13.woff2" as="font" type="font/woff2" crossOrigin="anonymous" />
        <link rel="preload" href="/fonts/g/unbounded-latin-15.woff2" as="font" type="font/woff2" crossOrigin="anonymous" />
        <link rel="preload" href="/fonts/g/golos-text-cyrillic-1.woff2" as="font" type="font/woff2" crossOrigin="anonymous" />
      </head>
      <body>{children}</body>
    </html>
  );
}

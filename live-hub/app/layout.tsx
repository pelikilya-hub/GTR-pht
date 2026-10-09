import type { Metadata, Viewport } from 'next';
import './globals.css';
import './hub.css';

export const metadata: Metadata = {
  title: 'GTR|PHT LIVE HUB',
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
      <body>{children}</body>
    </html>
  );
}

import './globals.css';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Ege Car Service',
  description: 'Gelir gider ve servis takip paneli',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="tr">
      <body>{children}</body>
    </html>
  );
}

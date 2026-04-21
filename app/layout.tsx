import './globals.css';
import { AuthProvider } from '@/components/AuthProvider';
import { Inter } from 'next/font/google';

const inter = Inter({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-inter',
});

export const metadata = {
  title: 'Ege Car Service',
  description: 'Tamir, bakım ve cari takip sistemi',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="tr" className={inter.variable}>
      <body className="app-body">
        <AuthProvider>{children}</AuthProvider>
      </body>
    </html>
  );
}

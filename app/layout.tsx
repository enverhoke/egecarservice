import './globals.css';
import { AuthProvider } from '@/components/AuthProvider';

export const metadata = {
  title: 'Ege Car Service',
  description: 'Tamir, bakım ve cari takip sistemi',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="tr">
      <body>
        <AuthProvider>{children}</AuthProvider>
      </body>
    </html>
  );
}

import './globals.css';
import { Inter } from 'next/font/google';
import { ShopProvider } from '@/context/ShopContext';
import { AuthProvider } from '@/context/AuthContext';

const inter = Inter({ subsets: ['latin', 'cyrillic'] });

export const metadata = {
  title: 'TryVice - Виртуальная примерка',
  description: 'SaaS платформа для интернет-магазинов',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ru">
      <body className={inter.className}>
        <AuthProvider>
          <ShopProvider>
            {children}
          </ShopProvider>
        </AuthProvider>
      </body>
    </html>
  );
}

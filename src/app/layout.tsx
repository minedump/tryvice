import './globals.css';
import { Inter } from 'next/font/google';
import { ShopProvider } from '@/context/ShopContext';
import { AuthProvider } from '@/context/AuthContext';
import AppWrapper from '@/components/AppWrapper';
import Script from 'next/script';

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
            <AppWrapper>
              {children}
            </AppWrapper>
          </ShopProvider>
        </AuthProvider>
        <Script src="https://widget.cloudpayments.ru/bundles/cloudpayments.js" strategy="beforeInteractive" />
      </body>
    </html>
  );
}

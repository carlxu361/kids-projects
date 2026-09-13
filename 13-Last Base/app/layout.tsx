import type { Metadata } from 'next';
import { Geist, Geist_Mono } from 'next/font/google';
import './globals.css';

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
});

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
});

export const metadata: Metadata = {
  metadataBase: new URL('https://last-base-roguelike.true-grebe-6293.chatgpt.site'),
  title: 'LAST BASE｜最后一座基地',
  description: '探索荒地，建造防线，守住最后一座基地。',
  openGraph: {
    title: 'LAST BASE｜最后一座基地',
    description: '白天探索、搜集资源、建造防线，夜晚亲自迎战怪潮。',
    images: [{ url: 'https://last-base-roguelike.true-grebe-6293.chatgpt.site/og.png', width: 1200, height: 630, alt: 'LAST BASE 最后一座基地' }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'LAST BASE｜最后一座基地',
    description: '探索荒地，建造防线，守住最后一座基地。',
    images: ['https://last-base-roguelike.true-grebe-6293.chatgpt.site/og.png'],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-CN">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        {children}
      </body>
    </html>
  );
}

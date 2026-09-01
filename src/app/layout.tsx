import type { Metadata } from 'next';
import { Geist, Inter_Tight } from 'next/font/google';
import './globals.css';

const geist = Geist({ subsets: ['latin'], variable: '--font-body', display: 'swap' });
const interTight = Inter_Tight({ subsets: ['latin'], variable: '--font-hero', display: 'swap' });

export const metadata: Metadata = {
  title: 'WEBERAISE — Premium web design & digital presence',
  description: 'WEBERAISE builds premium websites and digital presence systems for businesses in Pakistan and worldwide.',
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className={`${geist.variable} ${interTight.variable}`}>
      <body>{children}</body>
    </html>
  );
}

import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'CalenderJS Demo',
  description: 'CalenderJS 组件演示网站',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="zh-CN">
      <body>{children}</body>
    </html>
  );
}

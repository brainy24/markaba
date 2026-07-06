import type { ReactNode } from 'react';
import './globals.css';

export const metadata = {
  title: 'Markaba Admin',
  description: 'Markaba internal admin dashboard — Phase 1 skeleton.',
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}

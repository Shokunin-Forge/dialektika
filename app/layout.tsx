import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Dialektika',
  description: 'Put two strong AI models in one arena to debate a claim.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}

import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Invoice Generator & Billing Platform',
  description: 'Fullstack Next.js Billing Services & Invoice Generator with Golang Backend Migration Architecture',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body className="bg-slate-950 text-slate-100 antialiased font-sans">
        {children}
      </body>
    </html>
  );
}

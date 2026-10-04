import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Invoice Generator & Billing Platform',
  description: 'Precision Invoice Generator & Multi-tenant Billing Platform',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="bg-[#FAFAFA] text-[#0A0A0A] antialiased min-h-screen">
        {children}
      </body>
    </html>
  );
}

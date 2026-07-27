// ============================================
// ArcDoc Enterprise - Root Layout
// ============================================

import type { Metadata } from 'next';
import { ColorSchemeScript, MantineProvider } from '@mantine/core';
import { Notifications } from '@mantine/notifications';
import AppLayout from '@/components/layout/AppLayout';
import './globals.css';

export const metadata: Metadata = {
  title: {
    default: 'ArcDoc Enterprise',
    template: '%s | ArcDoc Enterprise',
  },
  description:
    'Platformă enterprise pentru managementul arhivei fizice și digitale - ArcDoc',
  keywords: [
    'arhivare',
    'document management',
    'arhiva digitala',
    'arhiva fizica',
    'ArcDoc',
    'enterprise',
  ],
  authors: [{ name: 'ArcDoc' }],
  robots: {
    index: false,
    follow: false,
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ro" suppressHydrationWarning>
      <head>
        <ColorSchemeScript defaultColorScheme="light" />
        <meta
          name="viewport"
          content="minimum-scale=1, initial-scale=1, width=device-width, user-scalable=no"
        />
        <link rel="icon" href="/favicon.ico" sizes="any" />
      </head>
      <body>
        <MantineProvider
          defaultColorScheme="light"
          theme={{
            primaryColor: 'blue',
            fontFamily:
              '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif',
            defaultRadius: 'md',
            colors: {
              // Custom color palette can be defined here
            },
            components: {
              AppShell: {
                defaultProps: {
                  padding: 'md',
                },
              },
              Button: {
                defaultProps: {
                  size: 'sm',
                },
              },
              TextInput: {
                defaultProps: {
                  size: 'sm',
                },
              },
              Select: {
                defaultProps: {
                  size: 'sm',
                },
              },
              Table: {
                defaultProps: {
                  striped: true,
                  highlightOnHover: true,
                  withTableBorder: true,
                  withColumnBorders: false,
                },
              },
            },
          }}
        >
          <Notifications position="top-right" zIndex={2077} />
          <AppLayout>{children}</AppLayout>
        </MantineProvider>
      </body>
    </html>
  );
}
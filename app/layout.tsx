// ============================================
// ArcDoc Enterprise 2026 — Root Layout
// ============================================

import type { Metadata, Viewport } from 'next';
import { ColorSchemeScript, MantineProvider } from '@mantine/core';
import { Notifications } from '@mantine/notifications';
import AppLayout from '@/components/layout/AppLayout';
import { arcdocTheme } from '@/lib/design-tokens';
import './globals.css';

export const metadata: Metadata = {
  title: {
    default: 'ArcDoc Enterprise',
    template: '%s | ArcDoc Enterprise',
  },
  description:
    'Platformă enterprise premium pentru managementul arhivei fizice și digitale — ArcDoc Enterprise Suite',
  keywords: [
    'arhivare', 'document management', 'arhiva digitala', 'arhiva fizica',
    'ArcDoc', 'enterprise', 'SaaS', 'arhivă electronică',
  ],
  authors: [{ name: 'ArcDoc' }],
  robots: { index: false, follow: false },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  minimumScale: 1,
  userScalable: false,
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
        <link rel="icon" href="/favicon.ico" sizes="any" />
      </head>
      <body>
        <MantineProvider
          defaultColorScheme="light"
          theme={{
            ...arcdocTheme,
            components: {
              Button: {
                defaultProps: {
                  size: 'sm',
                  radius: 'md',
                },
              },
              TextInput: {
                defaultProps: {
                  size: 'sm',
                  radius: 'md',
                },
              },
              Select: {
                defaultProps: {
                  size: 'sm',
                  radius: 'md',
                },
              },
              Paper: {
                defaultProps: {
                  radius: 'lg',
                },
                styles: {
                  root: {
                    background: 'var(--arcdoc-surface)',
                    border: '1px solid var(--arcdoc-border)',
                    transition: 'box-shadow 200ms cubic-bezier(0.4, 0, 0.2, 1)',
                  },
                },
              },
              Table: {
                defaultProps: {
                  highlightOnHover: true,
                  withTableBorder: false,
                  withColumnBorders: false,
                },
              },
              Modal: {
                defaultProps: {
                  radius: 'lg',
                  padding: 'lg',
                  overlayProps: {
                    backgroundOpacity: 0.5,
                    blur: 4,
                  },
                },
              },
              Badge: {
                defaultProps: {
                  radius: 'xl',
                },
              },
            },
          }}
        >
          <Notifications
            position="top-right"
            zIndex={2077}
            containerWidth={400}
            styles={{
              notification: {
                background: 'var(--arcdoc-glass-bg)',
                backdropFilter: 'var(--arcdoc-glass-blur)',
                WebkitBackdropFilter: 'var(--arcdoc-glass-blur)',
                border: 'var(--arcdoc-glass-border)',
                borderRadius: 'var(--arcdoc-radius-lg)',
                boxShadow: 'var(--arcdoc-shadow-lg)',
              },
            }}
          />
          <AppLayout>{children}</AppLayout>
        </MantineProvider>
      </body>
    </html>
  );
}

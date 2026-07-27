// ============================================
// ArcDoc Enterprise - Error Page Component
// ============================================

'use client';

import React from 'react';
import { Box, Title, Text, Button, Container, Group, Stack, Paper } from '@mantine/core';
import { IconHome, IconArrowLeft, IconRefresh } from '@tabler/icons-react';
import Link from 'next/link';

interface ErrorPageProps {
  code: number;
  title: string;
  description: string;
}

/**
 * Generic error page for 403, 404, 500 and other error codes.
 */
export default function ErrorPage({ code, title, description }: ErrorPageProps) {
  return (
    <Container size="sm" my="xl">
      <Paper shadow="sm" p="xl" radius="md" withBorder>
        <Stack align="center" gap="lg" ta="center">
          {/* Error Code */}
          <Text
            size="120px"
            fw={900}
            variant="gradient"
            gradient={{ from: 'blue', to: 'cyan', deg: 45 }}
            style={{ lineHeight: 1 }}
          >
            {code}
          </Text>

          <Box>
            <Title order={2} mb="xs">
              {title}
            </Title>
            <Text c="dimmed" size="md">
              {description}
            </Text>
          </Box>

          <Group mt="md">
            <Button
              variant="outline"
              leftSection={<IconArrowLeft size={18} />}
              onClick={() => window.history.back()}
            >
              Înapoi
            </Button>
            <Button
              leftSection={<IconHome size={18} />}
              component={Link}
              href="/dashboard"
            >
              Dashboard
            </Button>
            <Button
              variant="subtle"
              leftSection={<IconRefresh size={18} />}
              onClick={() => window.location.reload()}
            >
              Reîncarcă
            </Button>
          </Group>
        </Stack>
      </Paper>
    </Container>
  );
}

/**
 * Pre-configured error pages for common HTTP errors.
 */
export const ErrorPages = {
  Forbidden: () => (
    <ErrorPage
      code={403}
      title="Acces interzis"
      description="Nu aveți permisiunile necesare pentru a accesa această pagină. Contactați administratorul dacă considerați că este o eroare."
    />
  ),

  NotFound: () => (
    <ErrorPage
      code={404}
      title="Pagina nu a fost găsită"
      description="Pagina pe care o căutați nu există sau a fost mutată. Verificați adresa URL sau reveniți la pagina principală."
    />
  ),

  ServerError: () => (
    <ErrorPage
      code={500}
      title="Eroare internă"
      description="A apărut o eroare neașteptată. Încercați din nou sau contactați echipa de suport tehnic dacă problema persistă."
    />
  ),
};
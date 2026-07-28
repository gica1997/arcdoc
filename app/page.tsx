'use client';

import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { Box, Text } from '@mantine/core';
import { IconArchive } from '@tabler/icons-react';

export default function HomePage() {
  const router = useRouter();

  useEffect(() => {
    router.replace('/dashboard');
  }, [router]);

  return (
    <Box style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh' }}>
      <Box ta="center">
        <IconArchive size={48} style={{ color: 'var(--arcdoc-primary-500)' }} />
        <Text size="sm" c="dimmed" mt="sm">Redirecționare către ArcDoc...</Text>
      </Box>
    </Box>
  );
}

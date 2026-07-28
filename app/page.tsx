'use client';

import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { Box, Text } from '@mantine/core';
import { IconArchive } from '@tabler/icons-react';
import { useAuth } from '@/hooks/useAuth';

export default function HomePage() {
  const router = useRouter();
  const { isAuthenticated, isLoading } = useAuth();

  useEffect(() => {
    if (isLoading) return;
    if (isAuthenticated) {
      router.replace('/dashboard');
    } else {
      router.replace('/login');
    }
  }, [router, isAuthenticated, isLoading]);

  return (
    <Box style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh', background: 'var(--arcdoc-bg)' }}>
      <Box ta="center">
        <IconArchive size={48} style={{ color: 'var(--arcdoc-primary-500)' }} />
        <Text size="sm" c="dimmed" mt="sm">Se încarcă...</Text>
      </Box>
    </Box>
  );
}

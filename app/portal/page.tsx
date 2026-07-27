// ============================================
// ArcDoc Enterprise - Portal Root Redirect
// ============================================

'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Box, Text, Loader } from '@mantine/core';
import { useAuth } from '@/hooks/useAuth';

export default function PortalPage() {
  const router = useRouter();
  const { isAuthenticated, isLoading } = useAuth();

  useEffect(() => {
    if (!isLoading) {
      if (isAuthenticated) {
        router.replace('/portal/dashboard');
      } else {
        router.replace('/login');
      }
    }
  }, [isLoading, isAuthenticated, router]);

  return (
    <Box style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh' }}>
      <Loader size="lg" />
      <Text ml="md">Se redirecționează...</Text>
    </Box>
  );
}

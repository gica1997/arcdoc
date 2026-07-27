// ============================================
// ArcDoc Enterprise - Loading Screen Component
// ============================================

'use client';

import React from 'react';
import { Box, Loader, Text, Center } from '@mantine/core';

interface LoadingScreenProps {
  message?: string;
  fullScreen?: boolean;
}

/**
 * Loading screen component displayed during initial load or transitions.
 * Shows a centered loader with an optional message.
 */
export default function LoadingScreen({
  message = 'Se încarcă...',
  fullScreen = true,
}: LoadingScreenProps) {
  return (
    <Center
      style={{
        height: fullScreen ? '100vh' : '100%',
        minHeight: 200,
      }}
    >
      <Box ta="center">
        <Loader size="lg" color="blue" />
        <Text size="sm" c="dimmed" mt="md">
          {message}
        </Text>
      </Box>
    </Center>
  );
}
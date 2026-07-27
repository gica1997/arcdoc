// ============================================
// ArcDoc Enterprise - Portal Notifications
// ============================================

'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  Title, Paper, Group, Text, Badge, ActionIcon, Tooltip, Button, Box, Stack, Divider, Alert,
} from '@mantine/core';
import {
  IconBell, IconCheck, IconTrash, IconRefresh, IconNotification,
  IconFileText, IconSend, IconInfoCircle, IconAlertTriangle,
} from '@tabler/icons-react';
import { useAuth } from '@/hooks/useAuth';
import apiClient from '@/services/api';
import { useRouter } from 'next/navigation';

const typeIcons: Record<string, React.ReactNode> = {
  info: <IconInfoCircle size={18} />,
  success: <IconCheck size={18} />,
  warning: <IconAlertTriangle size={18} />,
  request: <IconSend size={18} />,
  document: <IconFileText size={18} />,
};

const typeColors: Record<string, string> = {
  info: 'blue', success: 'green', warning: 'orange', request: 'violet', document: 'cyan',
};

export default function PortalNotificationsPage() {
  const router = useRouter();
  const { user } = useAuth();
  const [notifications, setNotifications] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetch = useCallback(async () => {
    try {
      const r = await apiClient.get('/api/v1/notifications');
      setNotifications(r.data.data || []);
    } catch {} finally { setLoading(false); }
  }, []);

  useEffect(() => { fetch(); }, [fetch]);

  async function markAllRead() {
    await apiClient.put('/api/v1/notifications');
    fetch();
  }

  async function markRead(id: string) {
    await apiClient.put(`/api/v1/notifications/${id}`);
    fetch();
  }

  async function deleteNotification(id: string) {
    await apiClient.delete(`/api/v1/notifications/${id}`);
    fetch();
  }

  const unreadCount = notifications.filter(n => !n.is_read).length;

  return (
    <Box p="xl">
      <Group justify="space-between" mb="md">
        <Title order={3}>
          <Group gap={8}>
            <IconBell size={24} />
            Notificări
            {unreadCount > 0 && <Badge size="lg" color="red">{unreadCount} noi</Badge>}
          </Group>
        </Title>
        <Group>
          <Button variant="outline" size="sm" leftSection={<IconCheck size={14} />} onClick={markAllRead}
            disabled={unreadCount === 0}>
            Marchează toate citite
          </Button>
          <Button variant="outline" size="sm" leftSection={<IconRefresh size={14} />} onClick={fetch}>
            Reîmprospătează
          </Button>
        </Group>
      </Group>

      <Paper withBorder>
        {loading ? (
          <Text ta="center" py="xl" c="dimmed">Se încarcă...</Text>
        ) : notifications.length === 0 ? (
          <Box ta="center" py="xl">
            <IconBell size={48} opacity={0.3} />
            <Text mt="md" c="dimmed">Nu ai nicio notificare.</Text>
          </Box>
        ) : (
          <Stack gap={0}>
            {notifications.map((n, idx) => (
              <Box key={n.id}>
                {idx > 0 && <Divider />}
                <Paper p="md" radius={0}
                  style={{
                    cursor: n.link ? 'pointer' : 'default',
                    background: n.is_read ? 'transparent' : 'var(--mantine-color-blue-0)',
                    transition: 'background 0.15s',
                  }}
                  onClick={async () => {
                    if (!n.is_read) await markRead(n.id);
                    if (n.link) router.push(n.link);
                  }}
                >
                  <Group justify="space-between" align="flex-start">
                    <Group gap="sm" align="flex-start">
                      <Box mt={2} c={typeColors[n.type] || 'blue'}>
                        {typeIcons[n.type] || <IconNotification size={18} />}
                      </Box>
                      <Box style={{ flex: 1 }}>
                        <Group gap="xs" mb={2}>
                          <Text fw={n.is_read ? 400 : 600} size="sm">{n.title}</Text>
                          {!n.is_read && <Badge size="xs" color="blue">Nou</Badge>}
                        </Group>
                        <Text size="sm" c="dimmed">{n.body}</Text>
                        <Group gap="xs" mt={4}>
                          <Text size="xs" c="gray.5">
                            {n.created_at ? new Date(n.created_at).toLocaleString('ro') : ''}
                          </Text>
                          {n.type && (
                            <Badge size="xs" color={typeColors[n.type]} variant="light">{n.type}</Badge>
                          )}
                        </Group>
                      </Box>
                    </Group>
                    <Group gap={4}>
                      {!n.is_read && (
                        <Tooltip label="Marchează citit">
                          <ActionIcon variant="subtle" size="sm" color="blue"
                            onClick={e => { e.stopPropagation(); markRead(n.id); }}>
                            <IconCheck size={14} />
                          </ActionIcon>
                        </Tooltip>
                      )}
                      <Tooltip label="Șterge">
                        <ActionIcon variant="subtle" size="sm" color="red"
                          onClick={e => { e.stopPropagation(); deleteNotification(n.id); }}>
                          <IconTrash size={14} />
                        </ActionIcon>
                      </Tooltip>
                    </Group>
                  </Group>
                </Paper>
              </Box>
            ))}
          </Stack>
        )}
      </Paper>
    </Box>
  );
}

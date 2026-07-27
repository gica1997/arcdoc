// ============================================
// ArcDoc Enterprise - Solicitant Dashboard
// ============================================

'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  Title, Text, SimpleGrid, Paper, Group, Stack, Box, ThemeIcon, Badge, Timeline,
  Grid, Skeleton, Card, Progress, RingProgress, Center, Tooltip, ActionIcon,
  Button, Divider,
} from '@mantine/core';
import {
  IconSend, IconCheck, IconClock, IconX, IconAlertTriangle, IconFiles,
  IconBell, IconArrowRight, IconEye, IconFileText, IconHistory,
  IconTrendingUp, IconUser, IconBuilding, IconBriefcase, IconMail,
} from '@tabler/icons-react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { usePermissions } from '@/hooks/usePermissions';
import apiClient from '@/services/api';

const statusColor: Record<string, string> = {
  draft: 'gray', submitted: 'blue', approved: 'green', rejected: 'red',
  in_progress: 'orange', completed: 'teal', cancelled: 'gray',
};

const statusLabels: Record<string, string> = {
  draft: 'Ciornă', submitted: 'Depusă', approved: 'Aprobată', rejected: 'Respinsă',
  in_progress: 'În lucru', completed: 'Finalizată', cancelled: 'Anulată',
};

export default function SolicitantDashboardPage() {
  const router = useRouter();
  const { user } = useAuth();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(async () => {
    try {
      const r = await apiClient.get('/api/v1/portal/stats');
      setData(r.data.data);
    } catch {} finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchData(); const iv = setInterval(fetchData, 10000); return () => clearInterval(iv); }, [fetchData]);

  if (loading) {
    return (
      <Box p="xl">
        <Skeleton height={40} width={300} mb="md" />
        <SimpleGrid cols={{ base: 2, sm: 3, lg: 6 }} spacing="md" mb="xl">
          {Array(6).fill(0).map((_, i) => <Skeleton key={i} height={100} />)}
        </SimpleGrid>
        <Skeleton height={300} />
      </Box>
    );
  }

  const stats = data?.stats || {};
  const recentRequests = data?.recentRequests || [];
  const notifications = data?.notifications || [];

  const statCards = [
    { label: 'Solicitări Active', value: stats.active || 0, icon: IconSend, color: 'blue', desc: 'În curs de procesare' },
    { label: 'Finalizate', value: stats.completed || 0, icon: IconCheck, color: 'teal', desc: 'Solicitări încheiate' },
    { label: 'În așteptare', value: stats.pending || 0, icon: IconClock, color: 'gray', desc: 'Ciorne nesubmise' },
    { label: 'Respinse', value: stats.rejected || 0, icon: IconX, color: 'red', desc: 'Solicitări respinse' },
    { label: 'Urgente', value: stats.urgent || 0, icon: IconAlertTriangle, color: 'orange', desc: 'Prioritate maximă' },
    { label: 'Documente', value: stats.documents || 0, icon: IconFileText, color: 'violet', desc: 'Documente asociate' },
  ];

  const completionRate = stats.total > 0 ? Math.round((stats.completed / stats.total) * 100) : 0;
  const activeRate = stats.total > 0 ? Math.round(((stats.active + stats.urgent) / stats.total) * 100) : 0;

  return (
    <Box p="xl">
      {/* Welcome Section */}
      <Paper withBorder p="lg" radius="md" mb="xl" style={{
        background: 'linear-gradient(135deg, var(--mantine-color-blue-7) 0%, var(--mantine-color-blue-9) 100%)',
        color: '#fff',
      }}>
        <Group justify="space-between" align="flex-start">
          <Box>
            <Title order={2} c="#fff" mb={4}>
              Bun venit, {user?.firstName || 'Utilizator'}!
            </Title>
            <Text c="blue.2" size="sm" mb="md">
              Portalul tău personal pentru gestionarea solicitărilor arhivistice
            </Text>
            <Group gap="md">
              <Badge size="lg" variant="filled" color="blue.3" c="#fff">
                <Group gap={4}>
                  <IconUser size={12} />
                  <Text size="xs" c="#fff">{user?.firstName} {user?.lastName}</Text>
                </Group>
              </Badge>
              {user?.email && (
                <Badge size="lg" variant="filled" color="blue.3" c="#fff">
                  <Group gap={4}>
                    <IconMail size={12} />
                    <Text size="xs" c="#fff">{user?.email}</Text>
                  </Group>
                </Badge>
              )}
            </Group>
          </Box>
          <RingProgress
            size={100}
            thickness={10}
            sections={[
              { value: completionRate, color: '#fff' },
            ]}
            label={
              <Text ta="center" size="xs" c="#fff" fw={700}>
                {completionRate}%
              </Text>
            }
            styles={{
              root: { filter: 'drop-shadow(0 0 8px rgba(255,255,255,0.3))' },
            }}
          />
        </Group>
      </Paper>

      {/* Stats Cards */}
      <SimpleGrid cols={{ base: 2, sm: 3, lg: 6 }} spacing="md" mb="xl">
        {statCards.map((s) => {
          const Icon = s.icon;
          const isUrgent = s.label === 'Urgente' && s.value > 0;
          return (
            <Paper
              key={s.label}
              withBorder
              p="md"
              radius="md"
              style={{
                borderLeft: `4px solid var(--mantine-color-${isUrgent ? 'orange' : s.color}-6)`,
                transition: 'transform 0.15s, box-shadow 0.15s',
                cursor: 'default',
              }}
              className="stat-card"
            >
              <Group justify="space-between" mb={4}>
                <ThemeIcon size="lg" color={s.color} variant="light" radius="md">
                  <Icon size={20} />
                </ThemeIcon>
                {isUrgent && (
                  <Badge size="sm" variant="pulse" color="red">!</Badge>
                )}
              </Group>
              <Text size="xl" fw={700} mt="sm">{s.value}</Text>
              <Text size="xs" c="dimmed" tt="uppercase" fw={600}>{s.label}</Text>
              <Text size="xs" c="dimmed" lineClamp={1}>{s.desc}</Text>
            </Paper>
          );
        })}
      </SimpleGrid>

      {/* Main Grid */}
      <Grid>
        {/* Recent Requests */}
        <Grid.Col span={{ base: 12, md: 8 }}>
          <Paper withBorder p="md" radius="md">
            <Group justify="space-between" mb="md">
              <Title order={5}>Solicitări Recente</Title>
              <Button
                variant="subtle"
                size="sm"
                rightSection={<IconArrowRight size={14} />}
                onClick={() => router.push('/portal/requests')}
              >
                Vezi toate
              </Button>
            </Group>

            {recentRequests.length === 0 ? (
              <Text ta="center" py="xl" c="dimmed" size="sm">
                Nu ai nicio solicitare. Creează prima solicitare acum.
              </Text>
            ) : (
              <Stack gap={0}>
                {recentRequests.map((req: any) => (
                  <Paper
                    key={req.id}
                    p="sm"
                    radius="sm"
                    withBorder
                    mb="xs"
                    style={{ cursor: 'pointer', transition: 'background 0.15s' }}
                    className="request-card"
                    onClick={() => router.push(`/portal/requests/${req.id}`)}
                  >
                    <Group justify="space-between">
                      <Box style={{ flex: 1 }}>
                        <Group gap="xs" mb={2}>
                          <Badge variant="light" size="sm">{req.number}</Badge>
                          <Badge color={statusColor[req.status] || 'gray'} size="sm">
                            {statusLabels[req.status] || req.status}
                          </Badge>
                          {req.priority === 'urgent' && (
                            <Badge color="red" size="sm" variant="filled">Urgent</Badge>
                          )}
                        </Group>
                        <Text size="sm" fw={500}>{req.request_type}</Text>
                        <Group gap="xs" mt={2}>
                          <Text size="xs" c="dimmed">
                            {req.created_at ? new Date(req.created_at).toLocaleString('ro') : ''}
                          </Text>
                          {req.assigned_name && (
                            <>
                              <Text size="xs" c="dimmed">·</Text>
                              <Text size="xs" c="dimmed">Responsabil: {req.assigned_name}</Text>
                            </>
                          )}
                          {req.deadline && (
                            <>
                              <Text size="xs" c="dimmed">·</Text>
                              <Text size="xs" c="dimmed">Termen: {new Date(req.deadline).toLocaleDateString('ro')}</Text>
                            </>
                          )}
                        </Group>
                      </Box>
                      <ActionIcon variant="subtle" color="blue" size="md">
                        <IconEye size={16} />
                      </ActionIcon>
                    </Group>
                  </Paper>
                ))}
              </Stack>
            )}
          </Paper>
        </Grid.Col>

        {/* Notifications & Status */}
        <Grid.Col span={{ base: 12, md: 4 }}>
          {/* Notifications */}
          <Paper withBorder p="md" radius="md" mb="md">
            <Group justify="space-between" mb="sm">
              <Title order={5}>
                <Group gap={4}>
                  <IconBell size={16} />
                  Notificări
                </Group>
              </Title>
              {notifications.length > 0 && (
                <Badge size="sm" color="red">{notifications.length}</Badge>
              )}
            </Group>
            {notifications.length === 0 ? (
              <Text ta="center" py="md" c="dimmed" size="sm">Nicio notificare nouă.</Text>
            ) : (
              <Stack gap={4}>
                {notifications.slice(0, 5).map((n: any) => (
                  <Paper key={n.id} p="xs" radius="sm" withBorder>
                    <Text size="sm" fw={500} lineClamp={1}>{n.title}</Text>
                    <Text size="xs" c="dimmed" lineClamp={1}>{n.body}</Text>
                    <Text size="xs" c="gray.5">
                      {n.created_at ? new Date(n.created_at).toLocaleString('ro') : ''}
                    </Text>
                  </Paper>
                ))}
              </Stack>
            )}
          </Paper>

          {/* Progress Card */}
          <Paper withBorder p="md" radius="md">
            <Title order={5} mb="md">Progres Solicitări</Title>
            <Stack gap="sm">
              <Group justify="space-between">
                <Text size="sm">Rată finalizare</Text>
                <Text size="sm" fw={600}>{completionRate}%</Text>
              </Group>
              <Progress value={completionRate} color="teal" size="md" />
              <Group justify="space-between" mt="xs">
                <Text size="sm">Solicitări active</Text>
                <Text size="sm" fw={600}>{activeRate}%</Text>
              </Group>
              <Progress value={activeRate} color="blue" size="md" />
              <Divider my="xs" />
              <SimpleGrid cols={2}>
                <Box>
                  <Text size="xs" c="dimmed">Total</Text>
                  <Text fw={600}>{stats.total || 0}</Text>
                </Box>
                <Box>
                  <Text size="xs" c="dimmed">Finalizate</Text>
                  <Text fw={600} c="teal">{stats.completed || 0}</Text>
                </Box>
                <Box>
                  <Text size="xs" c="dimmed">În lucru</Text>
                  <Text fw={600} c="blue">{stats.active || 0}</Text>
                </Box>
                <Box>
                  <Text size="xs" c="dimmed">Respinse</Text>
                  <Text fw={600} c="red">{stats.rejected || 0}</Text>
                </Box>
              </SimpleGrid>
            </Stack>
          </Paper>
        </Grid.Col>
      </Grid>
    </Box>
  );
}

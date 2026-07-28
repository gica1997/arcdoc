'use client';

import { useState, useEffect } from 'react';
import {
  Title, Text, SimpleGrid, Paper, Group, Stack, Box, Badge, Timeline, Grid,
  Skeleton, ThemeIcon, Progress, Divider, Tooltip,
} from '@mantine/core';
import {
  IconArchive, IconUsers, IconSend, IconFileText, IconBooks,
  IconBuilding, IconSearch, IconTrash, IconHistory, IconTrendingUp,
  IconAlertTriangle, IconArrowUpRight, IconArrowDownRight,
  IconClock, IconCheck, IconX, IconLoader, IconFile,
} from '@tabler/icons-react';
import {
  LineChart, Line, BarChart, Bar, AreaChart, Area, XAxis, YAxis, CartesianGrid,
  Tooltip as ReTooltip, ResponsiveContainer, PieChart, Pie, Cell,
} from 'recharts';
import { useAuth } from '@/hooks/useAuth';
import apiClient from '@/services/api';
import { motion } from 'framer-motion';

const COLORS = ['#6366f1', '#10b981', '#f59e0b', '#f43f5e', '#06b6d4', '#8b5cf6', '#f97316', '#84cc16'];
const STATUS_COLORS: Record<string, string> = {
  available: 'green', borrowed: 'orange', archived: 'gray', maintenance: 'yellow',
  active: 'green', pending: 'yellow', completed: 'blue',
};

function StatCard({ label, value, icon: Icon, color, trend, trendValue, subtitle }: any) {
  return (
    <motion.div whileHover={{ y: -2 }} transition={{ duration: 0.15 }}>
      <Paper p="lg" radius="lg" className="kpi-card" withBorder>
        <Group justify="space-between" mb="xs">
          <Text size="xs" tt="uppercase" fw={600} c="dimmed">{label}</Text>
          <Box
            style={{
              width: 36, height: 36, borderRadius: 'var(--arcdoc-radius-md)',
              background: `var(--arcdoc-${color}-50)`,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}
          >
            <Icon size={18} style={{ color: `var(--arcdoc-${color}-500)` }} />
          </Box>
        </Group>
        <Text fw={700} size="2xl" style={{ lineHeight: 1 }}>{value?.toLocaleString() || '0'}</Text>
        {subtitle && <Text size="xs" c="dimmed" mt={4}>{subtitle}</Text>}
        {trend && (
          <Group gap={4} mt="xs">
            {trend === 'up' ? (
              <IconArrowUpRight size={14} style={{ color: 'var(--arcdoc-success-500)' }} />
            ) : (
              <IconArrowDownRight size={14} style={{ color: 'var(--arcdoc-danger-500)' }} />
            )}
            <Text size="xs" c={trend === 'up' ? 'green' : 'red'} fw={500}>{trendValue}</Text>
            <Text size="xs" c="dimmed">vs. luna trecută</Text>
          </Group>
        )}
      </Paper>
    </motion.div>
  );
}

export default function DashboardPage() {
  const { user } = useAuth();
  const [stats, setStats] = useState<any>(null);
  const [charts, setCharts] = useState<any>(null);
  const [activity, setActivity] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const [s, c, a] = await Promise.all([
          apiClient.get('/api/v1/dashboard/stats'),
          apiClient.get('/api/v1/dashboard/charts'),
          apiClient.get('/api/v1/dashboard/activity'),
        ]);
        setStats(s.data.data);
        setCharts(c.data.data);
        setActivity(a.data.data || []);
      } catch {} finally { setLoading(false); }
    }
    load();
  }, []);

  if (loading) {
    return (
      <div className="page-container">
        <Stack gap="lg">
          <Skeleton height={40} width={300} radius="md" />
          <SimpleGrid cols={{ base: 1, sm: 2, lg: 4 }} spacing="md">
            {[1,2,3,4].map(i => <Skeleton key={i} height={120} radius="lg" />)}
          </SimpleGrid>
          <Grid>
            <Grid.Col span={{ base: 12, md: 8 }}><Skeleton height={320} radius="lg" /></Grid.Col>
            <Grid.Col span={{ base: 12, md: 4 }}><Skeleton height={320} radius="lg" /></Grid.Col>
          </Grid>
        </Stack>
      </div>
    );
  }

  return (
    <div className="page-container">
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
        <Box mb="xl">
          <Group justify="space-between" mb={4}>
            <Box>
              <Text size="xs" tt="uppercase" fw={600} c="dimmed" mb={4}>Dashboard</Text>
              <Title order={3} fw={700}>Bun venit, {user?.firstName}</Title>
              <Text c="dimmed" size="sm">Prezentare generală a platformei ArcDoc</Text>
            </Box>
            <Badge
              size="lg"
              variant="light"
              color="green"
              style={{ padding: '0.5rem 1rem', borderRadius: 'var(--arcdoc-radius-lg)' }}
            >
              <Group gap={6}>
                <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#10b981' }} />
                Sistem activ
              </Group>
            </Badge>
          </Group>
        </Box>
      </motion.div>

      {/* KPI Cards */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1, duration: 0.4 }}
      >
        <SimpleGrid cols={{ base: 2, sm: 3, lg: 6 }} spacing="md" mb="xl">
          <StatCard label="Total Documente" value={stats?.totalDocuments || 0} icon={IconFileText} color="primary" trend="up" trendValue="12%" />
          <StatCard label="Dosare Fizice" value={stats?.totalPhysicalFiles || 0} icon={IconArchive} color="accent" trend="up" trendValue="5%" />
          <StatCard label="Utilizatori" value={stats?.totalUsers || 0} icon={IconUsers} color="success" />
          <StatCard label="Cereri Active" value={stats?.activeRequests || 0} icon={IconSend} color="warning" trend="up" trendValue="8%" />
          <StatCard label="Împrumuturi" value={stats?.activeLoans || 0} icon={IconBooks} color="danger" />
          <StatCard label="Casări Pend." value={stats?.pendingDisposals || 0} icon={IconTrash} color="secondary" />
        </SimpleGrid>
      </motion.div>

      {/* Charts Grid */}
      <Grid mb="xl">
        {/* Area Chart - Documents Trend */}
        <Grid.Col span={{ base: 12, md: 8 }}>
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
            <Paper p="lg" radius="lg" withBorder>
              <Group justify="space-between" mb="md">
                <Box>
                  <Text fw={600} size="md">Evoluție documente</Text>
                  <Text size="xs" c="dimmed">Documente înregistrate pe lună</Text>
                </Box>
                <Badge variant="light" color="gray">Ultimele 12 luni</Badge>
              </Group>
              <ResponsiveContainer width="100%" height={300}>
                <AreaChart data={(charts?.documentsByMonth || []).slice().reverse()}>
                  <defs>
                    <linearGradient id="colorCount" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--arcdoc-border)" />
                  <XAxis dataKey="month" fontSize={12} tick={{ fill: 'var(--arcdoc-text-secondary)' }} />
                  <YAxis fontSize={12} tick={{ fill: 'var(--arcdoc-text-secondary)' }} />
                  <ReTooltip
                    contentStyle={{
                      background: 'var(--arcdoc-glass-bg)',
                      backdropFilter: 'var(--arcdoc-glass-blur)',
                      border: 'var(--arcdoc-glass-border)',
                      borderRadius: 'var(--arcdoc-radius-md)',
                    }}
                  />
                  <Area type="monotone" dataKey="count" stroke="#6366f1" strokeWidth={2} fill="url(#colorCount)" name="Documente" />
                </AreaChart>
              </ResponsiveContainer>
            </Paper>
          </motion.div>
        </Grid.Col>

        {/* Status Pie Chart & Quick Actions */}
        <Grid.Col span={{ base: 12, md: 4 }}>
          <Stack gap="md">
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }}>
              <Paper p="lg" radius="lg" withBorder>
                <Text fw={600} size="md" mb="md">Status documente</Text>
                <ResponsiveContainer width="100%" height={200}>
                  <PieChart>
                    <Pie
                      data={charts?.documentsByStatus || []}
                      dataKey="value" nameKey="name"
                      cx="50%" cy="50%" innerRadius={50} outerRadius={80}
                      paddingAngle={3}
                    >
                      {(charts?.documentsByStatus || []).map((_: any, i: number) => (
                        <Cell key={i} fill={COLORS[i % COLORS.length]} />
                      ))}
                    </Pie>
                    <ReTooltip />
                  </PieChart>
                </ResponsiveContainer>
                <Group gap="xs" mt="sm" justify="center">
                  {(charts?.documentsByStatus || []).map((d: any, i: number) => (
                    <Badge key={i} variant="dot" color={COLORS[i].replace('#', '')} size="sm">{d.name}</Badge>
                  ))}
                </Group>
              </Paper>
            </motion.div>

            {/* Quick Actions */}
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
              <Paper p="lg" radius="lg" withBorder>
                <Text fw={600} size="md" mb="md">Acțiuni rapide</Text>
                <Stack gap="xs">
                  <Group gap="sm" p="xs" style={{ borderRadius: 'var(--arcdoc-radius-md)', cursor: 'pointer', transition: 'background 0.15s' }}
                    onMouseEnter={e => (e.currentTarget.style.background = 'var(--arcdoc-surface-hover)')}
                    onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}>
                    <IconSend size={18} style={{ color: 'var(--arcdoc-primary-500)' }} />
                    <Text size="sm">Solicitare nouă</Text>
                  </Group>
                  <Group gap="sm" p="xs" style={{ borderRadius: 'var(--arcdoc-radius-md)', cursor: 'pointer', transition: 'background 0.15s' }}
                    onMouseEnter={e => (e.currentTarget.style.background = 'var(--arcdoc-surface-hover)')}
                    onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}>
                    <IconFile size={18} style={{ color: 'var(--arcdoc-accent-500)' }} />
                    <Text size="sm">Înregistrează document</Text>
                  </Group>
                  <Group gap="sm" p="xs" style={{ borderRadius: 'var(--arcdoc-radius-md)', cursor: 'pointer', transition: 'background 0.15s' }}
                    onMouseEnter={e => (e.currentTarget.style.background = 'var(--arcdoc-surface-hover)')}
                    onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}>
                    <IconSearch size={18} style={{ color: 'var(--arcdoc-success-500)' }} />
                    <Text size="sm">Caută în arhivă</Text>
                  </Group>
                </Stack>
              </Paper>
            </motion.div>
          </Stack>
        </Grid.Col>

        {/* Bar Chart - Department Distribution */}
        <Grid.Col span={{ base: 12, md: 6 }}>
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.35 }}>
            <Paper p="lg" radius="lg" withBorder>
              <Text fw={600} size="md" mb="md">Documente pe departament</Text>
              <ResponsiveContainer width="100%" height={260}>
                <BarChart data={charts?.documentsByDepartment || []} barSize={32}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--arcdoc-border)" vertical={false} />
                  <XAxis dataKey="name" fontSize={11} tick={{ fill: 'var(--arcdoc-text-secondary)' }} />
                  <YAxis fontSize={12} tick={{ fill: 'var(--arcdoc-text-secondary)' }} />
                  <ReTooltip
                    contentStyle={{
                      background: 'var(--arcdoc-glass-bg)',
                      backdropFilter: 'var(--arcdoc-glass-blur)',
                      border: 'var(--arcdoc-glass-border)',
                      borderRadius: 'var(--arcdoc-radius-md)',
                    }}
                  />
                  <Bar dataKey="value" fill="#6366f1" radius={[4, 4, 0, 0]} name="Documente" />
                </BarChart>
              </ResponsiveContainer>
            </Paper>
          </motion.div>
        </Grid.Col>

        {/* Activity Feed */}
        <Grid.Col span={{ base: 12, md: 6 }}>
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}>
            <Paper p="lg" radius="lg" withBorder>
              <Group justify="space-between" mb="md">
                <Box>
                  <Text fw={600} size="md">Activitate recentă</Text>
                  <Text size="xs" c="dimmed">Ultimele acțiuni în platformă</Text>
                </Box>
                <Badge variant="light" color="blue" size="sm">{activity.length} evenimente</Badge>
              </Group>
              <Timeline active={activity.length} bulletSize={28} lineWidth={2} color="arcdoc-primary">
                {activity.slice(0, 5).map((a: any, i: number) => (
                  <Timeline.Item
                    key={i}
                    title={
                      <Text size="sm" fw={500}>
                        {a.action?.replace(/_/g, ' ').replace(/\b\w/g, (l: string) => l.toUpperCase())}
                      </Text>
                    }
                    bullet={
                      <Box style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        {a.action?.includes('create') ? <IconCheck size={12} /> :
                         a.action?.includes('delete') ? <IconX size={12} /> :
                         <IconLoader size={12} />}
                      </Box>
                    }
                  >
                    <Text size="xs" c="dimmed">
                      {a.user_name} · {a.entity_name || '-'}
                    </Text>
                    <Text size="xs" c="dimmed">
                      {a.created_at ? new Date(a.created_at).toLocaleString('ro') : ''}
                    </Text>
                  </Timeline.Item>
                ))}
              </Timeline>
            </Paper>
          </motion.div>
        </Grid.Col>
      </Grid>
    </div>
  );
}

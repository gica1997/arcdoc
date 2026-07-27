'use client';

import { useState, useEffect } from 'react';
import {
  Title, Text, SimpleGrid, Paper, Group, Stack, Box, ThemeIcon, Badge, Timeline, Grid, Skeleton,
} from '@mantine/core';
import {
  IconArchive, IconUsers, IconSend, IconFileText, IconClipboardList, IconBooks,
  IconBuilding, IconSearch, IconTrash, IconHistory, IconTrendingUp, IconAlertTriangle,
} from '@tabler/icons-react';
import {
  LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend,
} from 'recharts';
import { useAuth } from '@/hooks/useAuth';
import apiClient from '@/services/api';

const COLORS = ['#1a73e8', '#34a853', '#fbbc04', '#ea4335', '#6c5ce7', '#00bcd4', '#ff9800', '#9c27b0'];

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
    return <div className="page-container"><Skeleton height={200} mb="md" /><SimpleGrid cols={{ base:1, sm:2, lg:3 }} spacing="md"><Skeleton height={100} /><Skeleton height={100} /><Skeleton height={100} /></SimpleGrid></div>;
  }

  return (
    <div className="page-container">
      <div className="page-header">
        <Box>
          <Title order={2}>Dashboard</Title>
          <Text c="dimmed" size="sm">Bine ați venit, {user?.firstName} {user?.lastName}</Text>
        </Box>
      </div>

      {/* KPI Cards */}
      <SimpleGrid cols={{ base: 2, sm: 3, lg: 6 }} spacing="md" mb="xl">
        {[
          { label: 'Total Documente', value: stats?.totalDocuments || 0, icon: IconFileText, color: 'blue' },
          { label: 'Dosare Fizice', value: stats?.totalPhysicalFiles || 0, icon: IconArchive, color: 'teal' },
          { label: 'Utilizatori', value: stats?.totalUsers || 0, icon: IconUsers, color: 'violet' },
          { label: 'Cereri Active', value: stats?.activeRequests || 0, icon: IconSend, color: 'orange' },
          { label: 'Împrumuturi', value: stats?.activeLoans || 0, icon: IconBooks, color: 'red' },
          { label: 'Casări', value: stats?.pendingDisposals || 0, icon: IconTrash, color: 'gray' },
        ].map(s => (
          <Paper key={s.label} withBorder p="md" radius="md" className="stat-card">
            <Group><ThemeIcon size="lg" color={s.color} variant="light" radius="md"><s.icon size={20} /></ThemeIcon>
              <Stack gap={0}><Text size="xs" c="dimmed" tt="uppercase" fw={700}>{s.label}</Text><Text size="xl" fw={700}>{s.value}</Text></Stack>
            </Group>
          </Paper>
        ))}
      </SimpleGrid>

      <Grid mb="xl">
        {/* Line Chart - Documents by Month */}
        <Grid.Col span={{ base: 12, md: 6 }}>
          <Paper withBorder p="md" radius="md">
            <Title order={5} mb="sm">Documente pe lună</Title>
            <ResponsiveContainer width="100%" height={260}>
              <LineChart data={(charts?.documentsByMonth || []).slice().reverse()}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" fontSize={12} />
                <YAxis fontSize={12} />
                <Tooltip />
                <Line type="monotone" dataKey="count" stroke="#1a73e8" strokeWidth={2} name="Documente" />
              </LineChart>
            </ResponsiveContainer>
          </Paper>
        </Grid.Col>

        {/* Bar Chart - Documents by Department */}
        <Grid.Col span={{ base: 12, md: 6 }}>
          <Paper withBorder p="md" radius="md">
            <Title order={5} mb="sm">Documente pe departament</Title>
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={charts?.documentsByDepartment || []}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" fontSize={10} angle={-15} textAnchor="end" height={60} />
                <YAxis fontSize={12} />
                <Tooltip />
                <Bar dataKey="value" fill="#34a853" name="Documente" />
              </BarChart>
            </ResponsiveContainer>
          </Paper>
        </Grid.Col>

        {/* Pie Chart - Document Status */}
        <Grid.Col span={{ base: 12, md: 4 }}>
          <Paper withBorder p="md" radius="md">
            <Title order={5} mb="sm">Status documente</Title>
            <ResponsiveContainer width="100%" height={240}>
              <PieChart>
                <Pie data={charts?.documentsByStatus || []} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80} label={({name,value}) => `${name}:${value}`}>
                  {(charts?.documentsByStatus || []).map((_: any, i: number) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </Paper>
        </Grid.Col>

        {/* Pie Chart - Confidentiality */}
        <Grid.Col span={{ base: 12, md: 4 }}>
          <Paper withBorder p="md" radius="md">
            <Title order={5} mb="sm">Confidențialitate</Title>
            <ResponsiveContainer width="100%" height={240}>
              <PieChart>
                <Pie data={charts?.documentsByConfidentiality || []} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80} label>
                  {(charts?.documentsByConfidentiality || []).map((_: any, i: number) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </Paper>
        </Grid.Col>

        {/* Activity Feed */}
        <Grid.Col span={{ base: 12, md: 4 }}>
          <Paper withBorder p="md" radius="md">
            <Title order={5} mb="sm">Activitate recentă</Title>
            <Timeline active={activity.length} bulletSize={20} lineWidth={2}>
              {activity.slice(0, 8).map((a: any, i: number) => (
                <Timeline.Item key={i} title={a.action?.replace(/_/g, ' ')} bullet={<IconHistory size={12} />}>
                  <Text size="xs" c="dimmed">{a.user_name} · {a.entity_name || '-'} · {a.created_at ? new Date(a.created_at).toLocaleString('ro') : ''}</Text>
                </Timeline.Item>
              ))}
            </Timeline>
          </Paper>
        </Grid.Col>
      </Grid>
    </div>
  );
}
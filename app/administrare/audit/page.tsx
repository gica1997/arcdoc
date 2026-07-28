'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  Title, Paper, Group, TextInput, Select, Badge, Box, Text, Pagination, Stack,
  SimpleGrid,
} from '@mantine/core';
import { IconSearch, IconHistory } from '@tabler/icons-react';
import apiClient from '@/services/api';
import { motion } from 'framer-motion';

export default function AuditPage() {
  const [items, setItems] = useState<any[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [filterAction, setFilterAction] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [stats, setStats] = useState<any>({});

  const fetch = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      params.set('page', String(page)); params.set('limit', '30');
      if (search) params.set('search', search);
      if (filterAction) params.set('action', filterAction);
      const r = await apiClient.get(`/api/v1/audit${params.toString() ? `?${params}` : ''}`);
      setItems(r.data.data || []);
      setTotal(r.data.meta?.total || 0);
    } catch {} finally { setLoading(false); }
  }, [page, search, filterAction]);

  useEffect(() => {
    fetch();
    apiClient.get('/api/v1/audit/stats').then(r => setStats(r.data.data || {})).catch(() => {});
  }, [fetch]);

  const ACTION_COLORS: Record<string, string> = {
    create: 'green', update: 'blue', delete: 'red', login: 'teal', export: 'yellow',
  };

  return (
    <div className="page-container animate-fade-in">
      <Box mb="xl">
        <Group gap={12} mb={4}>
          <IconHistory size={28} style={{ color: 'var(--arcdoc-primary-500)' }} />
          <Box>
            <Text size="xs" tt="uppercase" fw={600} c="dimmed" mb={2}>Administrare</Text>
            <Title order={3} fw={700}>Jurnal audit</Title>
            <Text c="dimmed" size="sm">Istoricul activităților din platformă</Text>
          </Box>
        </Group>
      </Box>

      {/* Stats */}
      <SimpleGrid cols={{ base: 2, md: 4 }} spacing="md" mb="md">
        {[
          { label: 'Acțiuni totale', value: stats.total || 0, color: 'arcdoc-primary' },
          { label: 'Azi', value: stats.today || 0, color: 'arcdoc-success' },
          { label: 'Utilizatori activi', value: stats.unique_users || 0, color: 'arcdoc-accent' },
          { label: 'Exporturi', value: stats.exports || 0, color: 'arcdoc-warning' },
        ].map((s, i) => (
          <motion.div key={i} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}>
            <Paper p="md" radius="lg" withBorder>
              <Text size="xs" tt="uppercase" fw={600} c="dimmed">{s.label}</Text>
              <Text fw={700} size="xl" mt={4}>{s.value.toLocaleString()}</Text>
            </Paper>
          </motion.div>
        ))}
      </SimpleGrid>

      {/* Filters */}
      <Paper p="md" mb="md" radius="lg" withBorder>
        <Group>
          <TextInput placeholder="Caută în jurnal..." leftSection={<IconSearch size={14} />} value={search}
            onChange={e => { setSearch(e.target.value); setPage(1); }} style={{ flex: 1 }} />
          <Select placeholder="Acțiune" data={[
            { value: 'create', label: 'Creare' }, { value: 'update', label: 'Modificare' },
            { value: 'delete', label: 'Ștergere' }, { value: 'login', label: 'Autentificare' },
            { value: 'export', label: 'Export' },
          ]} clearable value={filterAction} onChange={v => { setFilterAction(v); setPage(1); }} />
        </Group>
      </Paper>

      {/* Audit Log */}
      <Paper radius="lg" withBorder style={{ overflow: 'hidden' }}>
        <div style={{ overflowX: 'auto' }}>
          <table className="arcdoc-table">
            <thead>
              <tr><th>Acțiune</th><th>Entitate</th><th>Utilizator</th><th>Detalii</th><th>Dată</th></tr>
            </thead>
            <tbody>
              {items.length === 0 ? (
                <tr><td colSpan={5}>
                  <div className="empty-state">
                    <IconHistory size={48} className="empty-state-icon" />
                    <div className="empty-state-title">Nicio activitate</div>
                  </div>
                </td></tr>
              ) : items.map((it, idx) => (
                <motion.tr key={it.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: idx * 0.01 }}>
                  <td>
                    <Badge color={ACTION_COLORS[it.action] || 'gray'} variant="light" size="sm">
                      {it.action}
                    </Badge>
                  </td>
                  <td><Text size="sm">{it.entity_type}.{it.entity_id?.slice(0, 8)}</Text></td>
                  <td><Text size="sm">{it.user_name || '-'}</Text></td>
                  <td><Text size="xs" c="dimmed">{it.details ? JSON.stringify(it.details).slice(0, 60) : '-'}</Text></td>
                  <td><Text size="xs" c="dimmed">{it.created_at ? new Date(it.created_at).toLocaleString('ro') : '-'}</Text></td>
                </motion.tr>
              ))}
            </tbody>
          </table>
        </div>
        {total > 30 && (
          <Box p="md" style={{ borderTop: '1px solid var(--arcdoc-border)' }}>
            <Group justify="space-between">
              <Text size="sm" c="dimmed">{total} înregistrări</Text>
              <Pagination total={Math.ceil(total / 30)} value={page} onChange={setPage} />
            </Group>
          </Box>
        )}
      </Paper>
    </div>
  );
}

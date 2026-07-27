// ============================================
// ArcDoc Enterprise - Solicitant My Requests
// ============================================

'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  Title, Table, Button, Group, TextInput, Select, Badge, ActionIcon, Modal, Stack, Alert,
  Pagination, Paper, Text, Box, Tabs, ThemeIcon,
} from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import {
  IconPlus, IconEye, IconSearch, IconSend, IconFileDownload, IconRefresh,
  IconRotate, IconTrash, IconFileImport,
} from '@tabler/icons-react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import apiClient, { handleApiError } from '@/services/api';

const statusColor: Record<string, string> = {
  draft: 'gray', submitted: 'blue', approved: 'green', rejected: 'red',
  in_progress: 'orange', completed: 'teal', cancelled: 'gray',
};
const statusLabels: Record<string, string> = {
  draft: 'Ciornă', submitted: 'Depusă', approved: 'Aprobată', rejected: 'Respinsă',
  in_progress: 'În lucru', completed: 'Finalizată', cancelled: 'Anulată',
};

const requestTypes = [
  { value: 'preluare', label: 'Preluare Documente', icon: IconFileImport },
  { value: 'consultare', label: 'Consultare Documente', icon: IconEye },
  { value: 'returnare', label: 'Returnare Documente', icon: IconRotate },
  { value: 'retragere_permanenta', label: 'Retragere Permanentă', icon: IconTrash },
];

export default function PortalRequestsPage() {
  const router = useRouter();
  const { user } = useAuth();
  const [items, setItems] = useState<any[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const [opened, { open, close }] = useDisclosure(false);
  const [form, setForm] = useState({ request_type: '', motivation: '', priority: 'normal', deadline: '', notes: '' });
  const [formError, setFormError] = useState('');
  const [saving, setSaving] = useState(false);
  const [nomenclatures, setNomenclatures] = useState<any[]>([]);

  const fetch = useCallback(async () => {
    if (!user?.id) return;
    setLoading(true);
    try {
      const params = new URLSearchParams();
      params.set('user_id', user.id);
      params.set('page', String(page));
      params.set('limit', '20');
      if (search) params.set('search', search);
      if (filterStatus) params.set('status', filterStatus);
      const r = await apiClient.get(`/api/v1/requests?${params}`);
      setItems(r.data.data || []);
      setTotal(r.data.meta?.total || 0);
    } catch {} finally { setLoading(false); }
  }, [user, page, search, filterStatus]);

  useEffect(() => {
    fetch();
    apiClient.get('/api/v1/nomenclatures?category=request_type').then(r => setNomenclatures(r.data.data || [])).catch(() => {});
  }, [fetch]);

  async function createRequest() {
    setFormError(''); setSaving(true);
    try {
      await apiClient.post('/api/v1/requests', form);
      close(); setForm({ request_type: '', motivation: '', priority: 'normal', deadline: '', notes: '' });
      fetch();
    } catch (err) { setFormError(handleApiError(err)); } finally { setSaving(false); }
  }

  const statusCounts = {
    all: total,
    active: items.filter(i => ['submitted', 'approved', 'in_progress'].includes(i.status)).length,
    completed: items.filter(i => i.status === 'completed').length,
    rejected: items.filter(i => i.status === 'rejected').length,
  };

  return (
    <Box p="xl">
      <Group justify="space-between" mb="md">
        <Title order={3}>Solicitările Mele</Title>
        <Group>
          <Button variant="outline" leftSection={<IconRefresh size={16} />} onClick={fetch}>Refresh</Button>
          <Button leftSection={<IconPlus size={16} />} onClick={open}>Solicitare Nouă</Button>
        </Group>
      </Group>

      {/* Quick Stats */}
      <Paper withBorder p="sm" mb="md">
        <Group gap="xl">
          <Box><Text size="xs" c="dimmed">Total</Text><Text fw={600}>{statusCounts.all}</Text></Box>
          <Box><Text size="xs" c="dimmed">Active</Text><Text fw={600} c="blue">{statusCounts.active}</Text></Box>
          <Box><Text size="xs" c="dimmed">Finalizate</Text><Text fw={600} c="teal">{statusCounts.completed}</Text></Box>
          <Box><Text size="xs" c="dimmed">Respinse</Text><Text fw={600} c="red">{statusCounts.rejected}</Text></Box>
        </Group>
      </Paper>

      {/* Filters */}
      <Paper withBorder p="sm" mb="md">
        <Group>
          <TextInput placeholder="Caută după număr sau tip..." leftSection={<IconSearch size={14} />}
            value={search} onChange={e => { setSearch(e.target.value); setPage(1); }} style={{ flex: 1 }} />
          <Select placeholder="Status" data={Object.entries(statusLabels).map(([k, v]) => ({ value: k, label: v }))}
            clearable value={filterStatus} onChange={v => { setFilterStatus(v); setPage(1); }} />
        </Group>
      </Paper>

      {/* Requests Table */}
      <Paper withBorder>
        <Table>
          <Table.Thead>
            <Table.Tr>
              <Table.Th>Nr. Solicitare</Table.Th>
              <Table.Th>Tip</Table.Th>
              <Table.Th>Status</Table.Th>
              <Table.Th>Prioritate</Table.Th>
              <Table.Th>Data Creării</Table.Th>
              <Table.Th>Responsabil</Table.Th>
              <Table.Th>Termen</Table.Th>
              <Table.Th>Acțiuni</Table.Th>
            </Table.Tr>
          </Table.Thead>
          <Table.Tbody>
            {items.length === 0 ? (
              <Table.Tr>
                <Table.Td colSpan={8}>
                  <Text ta="center" py="xl" c="dimmed">
                    {loading ? 'Se încarcă...' : 'Nu ai nicio solicitare. Creează prima solicitare acum.'}
                  </Text>
                </Table.Td>
              </Table.Tr>
            ) : (
              items.map(it => (
                <Table.Tr key={it.id} style={{ cursor: 'pointer' }} onClick={() => router.push(`/portal/requests/${it.id}`)}>
                  <Table.Td><Badge variant="light">{it.number}</Badge></Table.Td>
                  <Table.Td fw={500}>{it.request_type}</Table.Td>
                  <Table.Td><Badge color={statusColor[it.status] || 'gray'}>{statusLabels[it.status] || it.status}</Badge></Table.Td>
                  <Table.Td>
                    <Badge color={it.priority === 'urgent' ? 'red' : it.priority === 'high' ? 'orange' : 'blue'}>
                      {it.priority}
                    </Badge>
                  </Table.Td>
                  <Table.Td>{it.created_at ? new Date(it.created_at).toLocaleDateString('ro') : '-'}</Table.Td>
                  <Table.Td>{it.assigned_name || '-'}</Table.Td>
                  <Table.Td>{it.deadline ? new Date(it.deadline).toLocaleDateString('ro') : '-'}</Table.Td>
                  <Table.Td>
                    <ActionIcon variant="subtle" color="blue" onClick={e => { e.stopPropagation(); router.push(`/portal/requests/${it.id}`); }}>
                      <IconEye size={16} />
                    </ActionIcon>
                  </Table.Td>
                </Table.Tr>
              ))
            )}
          </Table.Tbody>
        </Table>
      </Paper>

      {total > 20 && <Pagination total={Math.ceil(total / 20)} value={page} onChange={setPage} mt="md" />}

      {/* New Request Modal */}
      <Modal opened={opened} onClose={close} title="Solicitare Nouă" size="lg">
        {formError && <Alert color="red" mb="md">{formError}</Alert>}
        <Stack>
          <Select label="Tip Solicitare"
            data={[
              ...requestTypes.map(rt => ({ value: rt.value, label: rt.label })),
              ...nomenclatures.filter((n: any) => !requestTypes.find(rt => rt.value === n.code)).map((n: any) => ({ value: n.code, label: n.name })),
            ]}
            value={form.request_type} onChange={v => setForm({ ...form, request_type: v || '' })} required
            description="Selectează tipul de solicitare arhivistică"
          />
          <Select label="Prioritate"
            data={[
              { value: 'low', label: 'Scăzută' }, { value: 'normal', label: 'Normală' },
              { value: 'high', label: 'Ridicată' }, { value: 'urgent', label: 'Urgentă' },
            ]}
            value={form.priority} onChange={v => setForm({ ...form, priority: v || 'normal' })}
          />
          <TextInput label="Motiv/Scop" value={form.motivation} onChange={e => setForm({ ...form, motivation: e.target.value })} />
          <TextInput label="Termen Dorit" type="date" value={form.deadline} onChange={e => setForm({ ...form, deadline: e.target.value })} />
          <TextInput label="Observații" value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} />
          <Group justify="flex-end">
            <Button variant="outline" onClick={close}>Anulează</Button>
            <Button onClick={createRequest} loading={saving} leftSection={<IconSend size={16} />}>Trimite Solicitarea</Button>
          </Group>
        </Stack>
      </Modal>
    </Box>
  );
}

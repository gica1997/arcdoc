'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  Title, Table, Button, Group, TextInput, Select, Badge, ActionIcon, Modal, Stack, Alert,
  Pagination, Paper, Tabs, Timeline, Text, Textarea, Box,
} from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import {
  IconPlus, IconEye, IconCheck, IconX, IconMessage, IconSearch, IconRefresh, IconUserCheck, IconSend,
} from '@tabler/icons-react';
import { useRouter } from 'next/navigation';
import apiClient, { handleApiError } from '@/services/api';

export default function RequestsPage() {
  const router = useRouter();
  const [items, setItems] = useState<any[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState<string | null>(null);
  const [filterType, setFilterType] = useState<string | null>(null);
  const [filterPriority, setFilterPriority] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const [opened, { open, close }] = useDisclosure(false);
  const [form, setForm] = useState({ request_type: '', motivation: '', priority: 'normal', deadline: '', notes: '', document_ids: [] as string[] });
  const [formError, setFormError] = useState('');
  const [saving, setSaving] = useState(false);
  const [nomenclatures, setNomenclatures] = useState<any[]>([]);

  const fetch = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      params.set('page', String(page)); params.set('limit', '20');
      if (search) params.set('search', search);
      if (filterStatus) params.set('status', filterStatus);
      if (filterType) params.set('type', filterType);
      if (filterPriority) params.set('priority', filterPriority);
      const r = await apiClient.get(`/api/v1/requests?${params}`);
      setItems(r.data.data || []);
      setTotal(r.data.meta?.total || 0);
    } catch { } finally { setLoading(false); }
  }, [page, search, filterStatus, filterType, filterPriority]);

  useEffect(() => {
    fetch();
    apiClient.get('/api/v1/nomenclatures?category=request_type').then(r => setNomenclatures(r.data.data || [])).catch(() => {});
  }, [fetch]);

  async function createRequest() {
    setFormError(''); setSaving(true);
    try {
      await apiClient.post('/api/v1/requests', form);
      close(); fetch();
    } catch (err) { setFormError(handleApiError(err)); } finally { setSaving(false); }
  }

  async function approve(id: string) {
    try { await apiClient.post(`/api/v1/requests/${id}/approve`); fetch(); } catch { }
  }

  async function reject(id: string) {
    const reason = prompt('Motiv respingere:');
    if (!reason) return;
    try { await apiClient.post(`/api/v1/requests/${id}/reject`, { rejectionReason: reason }); fetch(); } catch { }
  }

  const statusColor: Record<string, string> = {
    draft: 'gray', submitted: 'blue', approved: 'green', rejected: 'red', completed: 'teal', cancelled: 'orange',
  };

  return (
    <div className="page-container">
      <Group justify="space-between" mb="md">
        <Title order={3}>Solicitări</Title>
        <Group>
          <Button leftSection={<IconRefresh size={16} />} variant="outline" onClick={fetch}>Refresh</Button>
          <Button leftSection={<IconPlus size={16} />} onClick={open}>Solicitare nouă</Button>
        </Group>
      </Group>

      <Paper withBorder p="sm" mb="md">
        <Group>
          <TextInput placeholder="Caută..." leftSection={<IconSearch size={14} />} value={search}
            onChange={e => { setSearch(e.target.value); setPage(1); }} style={{ flex: 1 }} />
          <Select placeholder="Status" data={[
            { value: 'draft', label: 'Ciornă' }, { value: 'submitted', label: 'Depusă' },
            { value: 'approved', label: 'Aprobată' }, { value: 'rejected', label: 'Respinsă' },
            { value: 'completed', label: 'Finalizată' },
          ]} clearable value={filterStatus} onChange={v => { setFilterStatus(v); setPage(1); }} />
          <Select placeholder="Tip" data={nomenclatures.map((n: any) => ({ value: n.code, label: n.name }))}
            clearable value={filterType} onChange={v => { setFilterType(v); setPage(1); }} />
          <Select placeholder="Prioritate" data={[
            { value: 'low', label: 'Scăzută' }, { value: 'normal', label: 'Normală' },
            { value: 'high', label: 'Ridicată' }, { value: 'urgent', label: 'Urgentă' },
          ]} clearable value={filterPriority} onChange={v => { setFilterPriority(v); setPage(1); }} />
        </Group>
      </Paper>

      <Table>
        <Table.Thead>
          <Table.Tr><Table.Th>Nr.</Table.Th><Table.Th>Solicitant</Table.Th><Table.Th>Tip</Table.Th><Table.Th>Status</Table.Th><Table.Th>Prioritate</Table.Th><Table.Th>Atribuit</Table.Th><Table.Th>Data</Table.Th><Table.Th>Acțiuni</Table.Th></Table.Tr>
        </Table.Thead>
        <Table.Tbody>
          {items.map(it => (
            <Table.Tr key={it.id} style={{ cursor: 'pointer' }} onClick={() => router.push(`/solicitari/${it.id}`)}>
              <Table.Td><Badge variant="light">{it.number}</Badge></Table.Td>
              <Table.Td fw={500}>{it.user_name || '-'}</Table.Td>
              <Table.Td>{it.request_type}</Table.Td>
              <Table.Td><Badge color={statusColor[it.status] || 'gray'}>{it.status}</Badge></Table.Td>
              <Table.Td><Badge color={it.priority === 'urgent' ? 'red' : it.priority === 'high' ? 'orange' : 'blue'}>{it.priority}</Badge></Table.Td>
              <Table.Td>{it.assigned_name || '-'}</Table.Td>
              <Table.Td>{it.created_at ? new Date(it.created_at).toLocaleDateString('ro') : '-'}</Table.Td>
              <Table.Td>
                <Group gap={4} onClick={e => e.stopPropagation()}>
                  <ActionIcon variant="subtle" color="blue" onClick={() => router.push(`/solicitari/${it.id}`)}><IconEye size={16} /></ActionIcon>
                  {it.status === 'submitted' && (
                    <>
                      <ActionIcon variant="subtle" color="green" onClick={() => approve(it.id)}><IconCheck size={16} /></ActionIcon>
                      <ActionIcon variant="subtle" color="red" onClick={() => reject(it.id)}><IconX size={16} /></ActionIcon>
                    </>
                  )}
                </Group>
              </Table.Td>
            </Table.Tr>
          ))}
        </Table.Tbody>
      </Table>
      {total > 20 && <Pagination total={Math.ceil(total / 20)} value={page} onChange={setPage} mt="md" />}

      <Modal opened={opened} onClose={close} title="Solicitare nouă" size="lg">
        {formError && <Alert color="red" mb="md">{formError}</Alert>}
        <Stack>
          <Select label="Tip solicitare" data={nomenclatures.map((n: any) => ({ value: n.code, label: n.name }))}
            value={form.request_type} onChange={v => setForm({ ...form, request_type: v || '' })} required />
          <Textarea label="Motiv" value={form.motivation} onChange={e => setForm({ ...form, motivation: e.target.value })} />
          <Select label="Prioritate" data={[
            { value: 'low', label: 'Scăzută' }, { value: 'normal', label: 'Normală' },
            { value: 'high', label: 'Ridicată' }, { value: 'urgent', label: 'Urgentă' },
          ]} value={form.priority} onChange={v => setForm({ ...form, priority: v || 'normal' })} />
          <TextInput label="Termen" type="date" value={form.deadline} onChange={e => setForm({ ...form, deadline: e.target.value })} />
          <Textarea label="Observații" value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} />
          <Group justify="flex-end">
            <Button variant="outline" onClick={close}>Anulează</Button>
            <Button onClick={createRequest} loading={saving} leftSection={<IconSend size={16} />}>Trimite</Button>
          </Group>
        </Stack>
      </Modal>
    </div>
  );
}
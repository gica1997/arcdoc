'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  Title, Paper, Button, Group, TextInput, Select, Badge, ActionIcon, Modal,
  Stack, Alert, Pagination, Text, Box, Textarea,
} from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import {
  IconPlus, IconEye, IconCheck, IconX, IconSearch, IconRefresh,
  IconSend, IconAlertCircle, IconFilter, IconHistory,
} from '@tabler/icons-react';
import { useRouter } from 'next/navigation';
import apiClient, { handleApiError } from '@/services/api';
import { motion } from 'framer-motion';

const STATUS_CONFIG: Record<string, { label: string; color: string }> = {
  draft: { label: 'Ciornă', color: 'gray' },
  submitted: { label: 'Depusă', color: 'blue' },
  approved: { label: 'Aprobată', color: 'green' },
  rejected: { label: 'Respinsă', color: 'red' },
  completed: { label: 'Finalizată', color: 'teal' },
};

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
    try { await apiClient.post('/api/v1/requests', form); close(); fetch(); }
    catch (err) { setFormError(handleApiError(err)); } finally { setSaving(false); }
  }

  async function approve(id: string) {
    try { await apiClient.post(`/api/v1/requests/${id}/approve`); fetch(); } catch { }
  }

  async function reject(id: string) {
    const reason = prompt('Motiv respingere:');
    if (!reason) return;
    try { await apiClient.post(`/api/v1/requests/${id}/reject`, { rejectionReason: reason }); fetch(); } catch { }
  }

  return (
    <div className="page-container animate-fade-in">
      <Box mb="xl">
        <Group justify="space-between">
          <Box>
            <Text size="xs" tt="uppercase" fw={600} c="dimmed" mb={4}>Solicitări</Text>
            <Title order={3} fw={700}>Cereri și solicitări</Title>
            <Text c="dimmed" size="sm">Gestionați cererile de consultare, copiere și casare</Text>
          </Box>
          <Group>
            <Button variant="default" leftSection={<IconRefresh size={16} />} onClick={fetch} loading={loading}>Actualizare</Button>
            <Button leftSection={<IconPlus size={16} />} onClick={open}>Solicitare nouă</Button>
          </Group>
        </Group>
      </Box>

      <Paper p="md" mb="md" radius="lg" withBorder>
        <Group>
          <TextInput placeholder="Caută solicitări..." leftSection={<IconSearch size={14} />} value={search}
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

      <Paper radius="lg" withBorder style={{ overflow: 'hidden' }}>
        <div style={{ overflowX: 'auto' }}>
          <table className="arcdoc-table">
            <thead>
              <tr>
                <th>Nr.</th><th>Solicitant</th><th>Tip</th><th>Status</th><th>Prioritate</th><th>Data</th><th>Acțiuni</th>
              </tr>
            </thead>
            <tbody>
              {items.length === 0 ? (
                <tr><td colSpan={7}>
                  <div className="empty-state">
                    <IconHistory size={48} className="empty-state-icon" />
                    <div className="empty-state-title">Nicio solicitare</div>
                    <div className="empty-state-description">Nu există solicitări înregistrate momentan.</div>
                    <Button variant="light" onClick={open}>Crează solicitare</Button>
                  </div>
                </td></tr>
              ) : items.map((it, idx) => (
                <motion.tr key={it.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: idx * 0.03 }}
                  style={{ cursor: 'pointer' }} onClick={() => router.push(`/solicitari/${it.id}`)}>
                  <td><Badge variant="light">{it.number || it.id?.slice(0, 8)}</Badge></td>
                  <td><Text fw={500} size="sm">{it.user_name || '-'}</Text></td>
                  <td><Badge color="blue" variant="light" size="sm">{it.request_type}</Badge></td>
                  <td><Badge color={STATUS_CONFIG[it.status]?.color || 'gray'} variant="dot" size="sm">{STATUS_CONFIG[it.status]?.label || it.status}</Badge></td>
                  <td>
                    <Badge color={it.priority === 'urgent' ? 'red' : it.priority === 'high' ? 'orange' : it.priority === 'low' ? 'gray' : 'blue'} size="sm">
                      {it.priority}
                    </Badge>
                  </td>
                  <td><Text size="sm" c="dimmed">{it.created_at ? new Date(it.created_at).toLocaleDateString('ro') : '-'}</Text></td>
                  <td>
                    <Group gap={4} onClick={e => e.stopPropagation()}>
                      <ActionIcon variant="subtle" color="blue" onClick={() => router.push(`/solicitari/${it.id}`)}><IconEye size={16} /></ActionIcon>
                      {it.status === 'submitted' && (
                        <>
                          <ActionIcon variant="subtle" color="green" onClick={() => approve(it.id)}><IconCheck size={16} /></ActionIcon>
                          <ActionIcon variant="subtle" color="red" onClick={() => reject(it.id)}><IconX size={16} /></ActionIcon>
                        </>
                      )}
                    </Group>
                  </td>
                </motion.tr>
              ))}
            </tbody>
          </table>
        </div>
        {total > 20 && (
          <Box p="md" style={{ borderTop: '1px solid var(--arcdoc-border)' }}>
            <Group justify="space-between">
              <Text size="sm" c="dimmed">{total} solicitări în total</Text>
              <Pagination total={Math.ceil(total / 20)} value={page} onChange={setPage} />
            </Group>
          </Box>
        )}
      </Paper>

      <Modal opened={opened} onClose={close} title="Solicitare nouă" size="lg">
        {formError && <Alert icon={<IconAlertCircle size={16} />} color="red" mb="md">{formError}</Alert>}
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
            <Button variant="default" onClick={close}>Anulează</Button>
            <Button onClick={createRequest} loading={saving} leftSection={<IconSend size={16} />}>Trimite</Button>
          </Group>
        </Stack>
      </Modal>
    </div>
  );
}

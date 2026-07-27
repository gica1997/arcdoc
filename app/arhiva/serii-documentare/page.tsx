'use client';

import { useState, useEffect, useCallback } from 'react';
import { Title, Table, Button, Group, TextInput, Select, Badge, ActionIcon, Modal, Stack, Alert } from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import { IconPlus, IconEdit, IconTrash, IconSearch } from '@tabler/icons-react';
import apiClient, { handleApiError } from '@/services/api';

export default function DocumentSeriesPage() {
  const [items, setItems] = useState<any[]>([]);
  const [funds, setFunds] = useState<any[]>([]);
  const [retention, setRetention] = useState<any[]>([]);
  const [search, setSearch] = useState('');
  const [filterFund, setFilterFund] = useState<string | null>(null);
  const [opened, { open, close }] = useDisclosure(false);
  const [editing, setEditing] = useState<any>(null);
  const [form, setForm] = useState({ fund_id: '', parent_id: '', name: '', code: '', description: '', retention_period_id: '', confidentiality_level: 'public', observations: '' });
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  const fetch = useCallback(async () => {
    const params = new URLSearchParams();
    if (filterFund) params.set('fund_id', filterFund);
    try { const r = await apiClient.get(`/api/v1/document-series?${params}`); setItems(r.data.data || []); } catch { }
  }, [filterFund]);

  useEffect(() => {
    fetch();
    apiClient.get('/api/v1/archive-funds').then(r => setFunds(r.data.data || [])).catch(() => {});
    apiClient.get('/api/v1/retention-periods').then(r => setRetention(r.data.data || [])).catch(() => {});
  }, [fetch]);

  function openNew() { setEditing(null); setForm({ fund_id: '', parent_id: '', name: '', code: '', description: '', retention_period_id: '', confidentiality_level: 'public', observations: '' }); setError(''); open(); }
  function openEdit(it: any) { setEditing(it); setForm({ fund_id: it.fund_id, parent_id: it.parent_id||'', name: it.name, code: it.code, description: it.description||'', retention_period_id: it.retention_period_id||'', confidentiality_level: it.confidentiality_level||'public', observations: it.observations||'' }); setError(''); open(); }

  async function save() {
    setError(''); setSaving(true);
    try {
      if (editing) { await apiClient.put(`/api/v1/document-series/${editing.id}`, form); }
      else { await apiClient.post('/api/v1/document-series', form); }
      close(); fetch();
    } catch (err) { setError(handleApiError(err)); } finally { setSaving(false); }
  }

  async function del(it: any) { if (!confirm(`Ștergeți "${it.name}"?`)) return; try { await apiClient.delete(`/api/v1/document-series/${it.id}`); fetch(); } catch { } }

  return (
    <div className="page-container">
      <Group justify="space-between" mb="md">
        <Title order={3}>Serii Documentare</Title>
        <Button leftSection={<IconPlus size={16} />} onClick={openNew}>Adaugă serie</Button>
      </Group>
      <Group mb="md">
        <Select placeholder="Filtrează după fond" data={funds.map((f: any) => ({ value: f.id, label: f.name }))} clearable searchable value={filterFund} onChange={setFilterFund} style={{ flex: 1 }} />
      </Group>
      <Table>
        <Table.Thead><Table.Tr><Table.Th>Cod</Table.Th><Table.Th>Denumire</Table.Th><Table.Th>Fond</Table.Th><Table.Th>Confidențialitate</Table.Th><Table.Th>Acțiuni</Table.Th></Table.Tr></Table.Thead>
        <Table.Tbody>{items.map(it => (
          <Table.Tr key={it.id}>
            <Table.Td><Badge variant="light">{it.code}</Badge></Table.Td>
            <Table.Td fw={500}>{it.name}</Table.Td>
            <Table.Td>{it.fund_name || '-'}</Table.Td>
            <Table.Td><Badge color={it.confidentiality_level === 'confidential' ? 'red' : it.confidentiality_level === 'restricted' ? 'orange' : 'green'}>{it.confidentiality_level}</Badge></Table.Td>
            <Table.Td><Group gap={4}><ActionIcon variant="subtle" color="blue" onClick={() => openEdit(it)}><IconEdit size={16} /></ActionIcon><ActionIcon variant="subtle" color="red" onClick={() => del(it)}><IconTrash size={16} /></ActionIcon></Group></Table.Td>
          </Table.Tr>
        ))}</Table.Tbody>
      </Table>

      <Modal opened={opened} onClose={close} title={editing ? 'Editează serie' : 'Serie nouă'} size="lg">
        {error && <Alert color="red" mb="md">{error}</Alert>}
        <Stack>
          <Select label="Fond" data={funds.map((f: any) => ({ value: f.id, label: f.name }))} value={form.fund_id} onChange={v => setForm({...form, fund_id: v || ''})} required searchable />
          <Group grow><TextInput label="Denumire" value={form.name} onChange={e => setForm({...form, name: e.target.value})} required />
          <TextInput label="Cod" value={form.code} onChange={e => setForm({...form, code: e.target.value})} required /></Group>
          <TextInput label="Descriere" value={form.description} onChange={e => setForm({...form, description: e.target.value})} />
          <Group grow>
            <Select label="Termen păstrare" data={retention.map((r: any) => ({ value: r.id, label: r.name }))} clearable value={form.retention_period_id} onChange={v => setForm({...form, retention_period_id: v || ''})} />
            <Select label="Confidențialitate" data={[{ value: 'public', label: 'Public' }, { value: 'restricted', label: 'Restricționat' }, { value: 'confidential', label: 'Confidențial' }]} value={form.confidentiality_level} onChange={v => setForm({...form, confidentiality_level: v || 'public'})} />
          </Group>
          <TextInput label="Observații" value={form.observations} onChange={e => setForm({...form, observations: e.target.value})} />
          <Group justify="flex-end"><Button variant="outline" onClick={close}>Anulează</Button><Button onClick={save} loading={saving}>Salvează</Button></Group>
        </Stack>
      </Modal>
    </div>
  );
}
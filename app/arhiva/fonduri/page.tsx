'use client';

import { useState, useEffect, useCallback } from 'react';
import { Title, Table, Button, Group, TextInput, Select, Badge, ActionIcon, Modal, Stack, Alert } from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import { IconPlus, IconEdit, IconTrash, IconSearch } from '@tabler/icons-react';
import apiClient, { handleApiError } from '@/services/api';

export default function ArchiveFundsPage() {
  const [items, setItems] = useState<any[]>([]);
  const [departments, setDepartments] = useState<any[]>([]);
  const [funds, setFunds] = useState<any[]>([]);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string | null>(null);
  const [opened, { open, close }] = useDisclosure(false);
  const [editing, setEditing] = useState<any>(null);
  const [form, setForm] = useState({ name: '', code: '', description: '', parent_id: '', department_id: '', start_year: '', end_year: '', creator: '', observations: '' });
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  const fetch = useCallback(async () => {
    const params = new URLSearchParams();
    if (search) params.set('search', search);
    if (statusFilter) params.set('status', statusFilter);
    try { const r = await apiClient.get(`/api/v1/archive-funds?${params}`); setItems(r.data.data || []); } catch { }
  }, [search, statusFilter]);

  useEffect(() => {
    fetch();
    apiClient.get('/api/v1/departments').then(r => setDepartments(r.data.data || [])).catch(() => {});
    apiClient.get('/api/v1/archive-funds').then(r => setFunds(r.data.data.filter((f: any) => !f.parent_id) || [])).catch(() => {});
  }, [fetch]);

  function openNew() { setEditing(null); setForm({ name: '', code: '', description: '', parent_id: '', department_id: '', start_year: '', end_year: '', creator: '', observations: '' }); setError(''); open(); }
  function openEdit(it: any) { setEditing(it); setForm({ name: it.name, code: it.code, description: it.description||'', parent_id: it.parent_id||'', department_id: it.department_id||'', start_year: it.start_year||'', end_year: it.end_year||'', creator: it.creator||'', observations: it.observations||'' }); setError(''); open(); }

  async function save() {
    setError(''); setSaving(true);
    try {
      if (editing) { await apiClient.put(`/api/v1/archive-funds/${editing.id}`, form); }
      else { await apiClient.post('/api/v1/archive-funds', form); }
      close(); fetch();
    } catch (err) { setError(handleApiError(err)); } finally { setSaving(false); }
  }

  async function del(it: any) { if (!confirm(`Ștergeți "${it.name}"?`)) return; try { await apiClient.delete(`/api/v1/archive-funds/${it.id}`); fetch(); } catch { } }

  return (
    <div className="page-container">
      <Group justify="space-between" mb="md">
        <Title order={3}>Fonduri Arhivistice</Title>
        <Button leftSection={<IconPlus size={16} />} onClick={openNew}>Adaugă fond</Button>
      </Group>
      <Group mb="md">
        <TextInput placeholder="Caută..." leftSection={<IconSearch size={14} />} value={search} onChange={e => { setSearch(e.target.value); }} style={{ flex: 1 }} />
        <Select placeholder="Status" data={[{ value: 'active', label: 'Activ' }, { value: 'archived', label: 'Arhivat' }]} clearable value={statusFilter} onChange={setStatusFilter} />
      </Group>
      <Table>
        <Table.Thead><Table.Tr><Table.Th>Cod</Table.Th><Table.Th>Denumire</Table.Th><Table.Th>Departament</Table.Th><Table.Th>Perioadă</Table.Th><Table.Th>Status</Table.Th><Table.Th>Acțiuni</Table.Th></Table.Tr></Table.Thead>
        <Table.Tbody>{items.map(it => (
          <Table.Tr key={it.id}>
            <Table.Td><Badge variant="light">{it.code}</Badge></Table.Td>
            <Table.Td fw={500}>{it.name}{it.parent_id && <Badge ml="xs" size="sm" color="gray">Subfond</Badge>}</Table.Td>
            <Table.Td>{it.department_name || '-'}</Table.Td>
            <Table.Td>{it.start_year || '-'} - {it.end_year || '-'}</Table.Td>
            <Table.Td><Badge color={it.status === 'active' ? 'green' : 'orange'}>{it.status}</Badge></Table.Td>
            <Table.Td><Group gap={4}><ActionIcon variant="subtle" color="blue" onClick={() => openEdit(it)}><IconEdit size={16} /></ActionIcon><ActionIcon variant="subtle" color="red" onClick={() => del(it)}><IconTrash size={16} /></ActionIcon></Group></Table.Td>
          </Table.Tr>
        ))}</Table.Tbody>
      </Table>

      <Modal opened={opened} onClose={close} title={editing ? 'Editează fond' : 'Fond nou'} size="lg">
        {error && <Alert color="red" mb="md">{error}</Alert>}
        <Stack>
          <Group grow><TextInput label="Denumire" value={form.name} onChange={e => setForm({...form, name: e.target.value})} required />
          <TextInput label="Cod" value={form.code} onChange={e => setForm({...form, code: e.target.value})} required /></Group>
          <TextInput label="Descriere" value={form.description} onChange={e => setForm({...form, description: e.target.value})} />
          <Group grow>
            <Select label="Departament" data={departments.map((d:any) => ({ value: d.id, label: d.name }))} clearable value={form.department_id} onChange={v => setForm({...form, department_id: v || ''})} />
            <Select label="Fond părinte (subfond)" data={funds.map((f:any) => ({ value: f.id, label: f.name }))} clearable value={form.parent_id} onChange={v => setForm({...form, parent_id: v || ''})} />
          </Group>
          <Group grow>
            <TextInput label="An început" value={form.start_year} onChange={e => setForm({...form, start_year: e.target.value})} />
            <TextInput label="An sfârșit" value={form.end_year} onChange={e => setForm({...form, end_year: e.target.value})} />
          </Group>
          <TextInput label="Creator" value={form.creator} onChange={e => setForm({...form, creator: e.target.value})} />
          <TextInput label="Observații" value={form.observations} onChange={e => setForm({...form, observations: e.target.value})} />
          <Group justify="flex-end"><Button variant="outline" onClick={close}>Anulează</Button><Button onClick={save} loading={saving}>Salvează</Button></Group>
        </Stack>
      </Modal>
    </div>
  );
}
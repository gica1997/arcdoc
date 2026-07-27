'use client';

import { useState, useEffect, useCallback } from 'react';
import { Title, Table, Button, Group, TextInput, Select, Badge, ActionIcon, Modal, Stack, Alert } from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import { IconPlus, IconEdit, IconTrash, IconSearch } from '@tabler/icons-react';
import apiClient, { handleApiError } from '@/services/api';

const LEVELS = [{ value: 'chapter', label: 'Capitol' }, { value: 'subchapter', label: 'Subcapitol' }, { value: 'position', label: 'Poziție' }];

export default function ArchiveClassificationPage() {
  const [items, setItems] = useState<any[]>([]);
  const [retention, setRetention] = useState<any[]>([]);
  const [search, setSearch] = useState('');
  const [levelFilter, setLevelFilter] = useState<string | null>(null);
  const [opened, { open, close }] = useDisclosure(false);
  const [editing, setEditing] = useState<any>(null);
  const [form, setForm] = useState({ name: '', code: '', description: '', parent_id: '', level: 'chapter', retention_period_id: '', retention_type: 'temporary', observations: '' });
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  const fetch = useCallback(async () => {
    const params = new URLSearchParams();
    if (search) params.set('search', search);
    if (levelFilter) params.set('level', levelFilter);
    try { const r = await apiClient.get(`/api/v1/archive-classification?${params}`); setItems(r.data.data || []); } catch { }
  }, [search, levelFilter]);

  useEffect(() => {
    fetch();
    apiClient.get('/api/v1/retention-periods').then(r => setRetention(r.data.data || [])).catch(() => {});
  }, [fetch]);

  function openNew() { setEditing(null); setForm({ name: '', code: '', description: '', parent_id: '', level: 'chapter', retention_period_id: '', retention_type: 'temporary', observations: '' }); setError(''); open(); }
  function openEdit(it: any) { setEditing(it); setForm({ name: it.name, code: it.code, description: it.description||'', parent_id: it.parent_id||'', level: it.level, retention_period_id: it.retention_period_id||'', retention_type: it.retention_type||'temporary', observations: it.observations||'' }); setError(''); open(); }

  async function save() {
    setError(''); setSaving(true);
    try {
      if (editing) { await apiClient.put(`/api/v1/archive-classification/${editing.id}`, form); }
      else { await apiClient.post('/api/v1/archive-classification', form); }
      close(); fetch();
    } catch (err) { setError(handleApiError(err)); } finally { setSaving(false); }
  }

  async function del(it: any) { if (!confirm(`Ștergeți "${it.name}"?`)) return; try { await apiClient.delete(`/api/v1/archive-classification/${it.id}`); fetch(); } catch { } }

  const parents = items.filter(i => i.level !== 'position').map(i => ({ value: i.id, label: `${i.name} (${i.level})` }));

  return (
    <div className="page-container">
      <Group justify="space-between" mb="md">
        <Title order={3}>Nomenclator Arhivistic</Title>
        <Button leftSection={<IconPlus size={16} />} onClick={openNew}>Adaugă</Button>
      </Group>
      <Group mb="md">
        <TextInput placeholder="Caută..." leftSection={<IconSearch size={14} />} value={search} onChange={e => setSearch(e.target.value)} style={{ flex: 1 }} />
        <Select placeholder="Nivel" data={LEVELS} clearable value={levelFilter} onChange={setLevelFilter} />
      </Group>
      <Table>
        <Table.Thead><Table.Tr><Table.Th>Cod</Table.Th><Table.Th>Denumire</Table.Th><Table.Th>Nivel</Table.Th><Table.Th>Tip păstrare</Table.Th><Table.Th>Acțiuni</Table.Th></Table.Tr></Table.Thead>
        <Table.Tbody>{items.map(it => (
          <Table.Tr key={it.id}>
            <Table.Td><Badge variant="light">{it.code}</Badge></Table.Td>
            <Table.Td fw={500} style={{ paddingLeft: `${(it.level === 'subchapter' ? 20 : it.level === 'position' ? 40 : 0)}px` }}>{it.name}</Table.Td>
            <Table.Td><Badge>{LEVELS.find(l => l.value === it.level)?.label || it.level}</Badge></Table.Td>
            <Table.Td><Badge color={it.retention_type === 'permanent' ? 'red' : 'blue'}>{it.retention_type}</Badge></Table.Td>
            <Table.Td><Group gap={4}><ActionIcon variant="subtle" color="blue" onClick={() => openEdit(it)}><IconEdit size={16} /></ActionIcon><ActionIcon variant="subtle" color="red" onClick={() => del(it)}><IconTrash size={16} /></ActionIcon></Group></Table.Td>
          </Table.Tr>
        ))}</Table.Tbody>
      </Table>

      <Modal opened={opened} onClose={close} title={editing ? 'Editează' : 'Adaugă'} size="lg">
        {error && <Alert color="red" mb="md">{error}</Alert>}
        <Stack>
          <Select label="Nivel" data={LEVELS} value={form.level} onChange={v => setForm({...form, level: v || 'chapter'})} />
          <Select label="Părinte" data={parents} clearable value={form.parent_id} onChange={v => setForm({...form, parent_id: v || ''})} />
          <Group grow><TextInput label="Denumire" value={form.name} onChange={e => setForm({...form, name: e.target.value})} required />
          <TextInput label="Cod" value={form.code} onChange={e => setForm({...form, code: e.target.value})} required /></Group>
          <TextInput label="Descriere" value={form.description} onChange={e => setForm({...form, description: e.target.value})} />
          <Group grow>
            <Select label="Termen păstrare" data={retention.map((r: any) => ({ value: r.id, label: r.name }))} clearable value={form.retention_period_id} onChange={v => setForm({...form, retention_period_id: v || ''})} />
            <Select label="Tip păstrare" data={[{ value: 'temporary', label: 'Temporară' }, { value: 'permanent', label: 'Permanentă' }]} value={form.retention_type} onChange={v => setForm({...form, retention_type: v || 'temporary'})} />
          </Group>
          <TextInput label="Observații" value={form.observations} onChange={e => setForm({...form, observations: e.target.value})} />
          <Group justify="flex-end"><Button variant="outline" onClick={close}>Anulează</Button><Button onClick={save} loading={saving}>Salvează</Button></Group>
        </Stack>
      </Modal>
    </div>
  );
}
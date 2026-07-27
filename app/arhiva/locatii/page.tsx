'use client';

import { useState, useEffect } from 'react';
import {
  Title, Table, Button, Group, TextInput, Select, Badge, ActionIcon, Modal, Stack, Alert,
} from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import { IconPlus, IconEdit, IconTrash, IconSearch } from '@tabler/icons-react';
import apiClient, { handleApiError } from '@/services/api';

const TYPES = [
  { value: 'deposit', label: 'Depozit' }, { value: 'room', label: 'Cameră' },
  { value: 'zone', label: 'Zonă' }, { value: 'shelf', label: 'Raft' },
  { value: 'unit', label: 'Corp' }, { value: 'tray', label: 'Poliță' },
  { value: 'box', label: 'Cutie' }, { value: 'folder', label: 'Dosar' },
];

export default function ArchiveLocationsPage() {
  const [items, setItems] = useState<any[]>([]);
  const [search, setSearch] = useState('');
  const [opened, { open, close }] = useDisclosure(false);
  const [editing, setEditing] = useState<any>(null);
  const [form, setForm] = useState({ name: '', code: '', location_type: 'room', parent_id: '', capacity: '', observations: '' });
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  async function fetch() {
    try { const r = await apiClient.get('/api/v1/archive-locations'); setItems(r.data.data || []); } catch { }
  }
  useEffect(() => { fetch(); }, []);

  function openNew() { setEditing(null); setForm({ name: '', code: '', location_type: 'room', parent_id: '', capacity: '', observations: '' }); setError(''); open(); }
  function openEdit(it: any) { setEditing(it); setForm({ name: it.name, code: it.code||'', location_type: it.location_type, parent_id: it.parent_id||'', capacity: it.capacity||'', observations: it.observations||'' }); setError(''); open(); }

  async function save() {
    setError(''); setSaving(true);
    try {
      if (editing) { await apiClient.put(`/api/v1/archive-locations/${editing.id}`, form); }
      else { await apiClient.post('/api/v1/archive-locations', form); }
      close(); fetch();
    } catch (err) { setError(handleApiError(err)); } finally { setSaving(false); }
  }

  async function del(it: any) { if (!confirm('Ștergeți?')) return; try { await apiClient.delete(`/api/v1/archive-locations/${it.id}`); fetch(); } catch { } }

  const parents = items.filter(i => i.location_type !== 'folder').map(i => ({ value: i.id, label: `${i.name} (${i.location_type})` }));
  const filtered = search ? items.filter(i => i.name.toLowerCase().includes(search.toLowerCase()) || (i.code||'').toLowerCase().includes(search.toLowerCase())) : items;

  return (
    <div className="page-container">
      <Group justify="space-between" mb="md">
        <Title order={3}>Locații Arhivă</Title>
        <Button leftSection={<IconPlus size={16} />} onClick={openNew}>Adaugă</Button>
      </Group>
      <TextInput placeholder="Caută..." leftSection={<IconSearch size={14} />} value={search} onChange={e => setSearch(e.target.value)} mb="md" />
      <Table>
        <Table.Thead><Table.Tr><Table.Th>Cod</Table.Th><Table.Th>Denumire</Table.Th><Table.Th>Tip</Table.Th><Table.Th>Nivel</Table.Th><Table.Th>Capacitate</Table.Th><Table.Th>Acțiuni</Table.Th></Table.Tr></Table.Thead>
        <Table.Tbody>
          {filtered.map(it => (
            <Table.Tr key={it.id}>
              <Table.Td><Badge variant="light">{it.code || '-'}</Badge></Table.Td>
              <Table.Td fw={500} style={{ paddingLeft: `${(it.level-1)*20}px` }}>{it.name}</Table.Td>
              <Table.Td><Badge color="blue">{TYPES.find(t=>t.value===it.location_type)?.label||it.location_type}</Badge></Table.Td>
              <Table.Td>Nivel {it.level}</Table.Td>
              <Table.Td>{it.capacity || '-'}</Table.Td>
              <Table.Td><Group gap={4}><ActionIcon variant="subtle" color="blue" onClick={()=>openEdit(it)}><IconEdit size={16}/></ActionIcon><ActionIcon variant="subtle" color="red" onClick={()=>del(it)}><IconTrash size={16}/></ActionIcon></Group></Table.Td>
            </Table.Tr>
          ))}
        </Table.Tbody>
      </Table>

      <Modal opened={opened} onClose={close} title={editing?'Editează':'Adaugă locație'}>
        {error&&<Alert color="red" mb="md">{error}</Alert>}
        <Stack>
          <TextInput label="Denumire" value={form.name} onChange={e=>setForm({...form,name:e.target.value})} required />
          <TextInput label="Cod" value={form.code} onChange={e=>setForm({...form,code:e.target.value})} />
          <Select label="Tip" data={TYPES} value={form.location_type} onChange={v=>setForm({...form,location_type:v||'room'})} />
          <Select label="Părinte" data={parents} clearable value={form.parent_id} onChange={v=>setForm({...form,parent_id:v||''})} />
          <TextInput label="Capacitate" type="number" value={form.capacity} onChange={e=>setForm({...form,capacity:e.target.value})} />
          <TextInput label="Observații" value={form.observations} onChange={e=>setForm({...form,observations:e.target.value})} />
          <Group justify="flex-end"><Button variant="outline" onClick={close}>Anulează</Button><Button onClick={save} loading={saving}>Salvează</Button></Group>
        </Stack>
      </Modal>
    </div>
  );
}
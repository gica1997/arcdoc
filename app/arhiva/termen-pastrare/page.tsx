'use client';

import { useState, useEffect } from 'react';
import { Title, Table, Button, Group, TextInput, Modal, Stack, ActionIcon, Badge, Switch, Alert } from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import { IconPlus, IconEdit, IconTrash } from '@tabler/icons-react';
import apiClient, { handleApiError } from '@/services/api';

export default function RetentionPeriodsPage() {
  const [items, setItems] = useState<any[]>([]);
  const [opened, { open, close }] = useDisclosure(false);
  const [editing, setEditing] = useState<any>(null);
  const [form, setForm] = useState({ name: '', code: '', years: '', is_permanent: false, description: '' });
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  async function fetch() { try { const r = await apiClient.get('/api/v1/retention-periods'); setItems(r.data.data || []); } catch { } }
  useEffect(() => { fetch(); }, []);

  function openNew() { setEditing(null); setForm({ name: '', code: '', years: '', is_permanent: false, description: '' }); setError(''); open(); }
  function openEdit(it: any) { setEditing(it); setForm({ name: it.name, code: it.code||'', years: it.years||'', is_permanent: it.is_permanent, description: it.description||'' }); setError(''); open(); }

  async function save() {
    setError(''); setSaving(true);
    try {
      if (editing) { await apiClient.put(`/api/v1/retention-periods/${editing.id}`, form); }
      else { await apiClient.post('/api/v1/retention-periods', form); }
      close(); fetch();
    } catch (err) { setError(handleApiError(err)); } finally { setSaving(false); }
  }

  return (
    <div className="page-container">
      <Group justify="space-between" mb="md"><Title order={3}>Termene de Păstrare</Title><Button leftSection={<IconPlus size={16} />} onClick={openNew}>Adaugă</Button></Group>
      <Table>
        <Table.Thead><Table.Tr><Table.Th>Nume</Table.Th><Table.Th>Cod</Table.Th><Table.Th>Ani</Table.Th><Table.Th>Tip</Table.Th><Table.Th>Acțiuni</Table.Th></Table.Tr></Table.Thead>
        <Table.Tbody>{items.map(it => (
          <Table.Tr key={it.id}><Table.Td fw={500}>{it.name}</Table.Td><Table.Td><Badge variant="light">{it.code}</Badge></Table.Td><Table.Td>{it.years || '-'}</Table.Td>
            <Table.Td><Badge color={it.is_permanent ? 'red' : 'blue'}>{it.is_permanent ? 'Permanent' : 'Temporar'}</Badge></Table.Td>
            <Table.Td><Group gap={4}><ActionIcon variant="subtle" color="blue" onClick={() => openEdit(it)}><IconEdit size={16} /></ActionIcon></Group></Table.Td>
          </Table.Tr>
        ))}</Table.Tbody>
      </Table>
      <Modal opened={opened} onClose={close} title={editing ? 'Editează' : 'Adaugă'}>
        {error && <Alert color="red" mb="md">{error}</Alert>}
        <Stack>
          <TextInput label="Nume" value={form.name} onChange={e => setForm({...form, name: e.target.value})} required />
          <TextInput label="Cod" value={form.code} onChange={e => setForm({...form, code: e.target.value})} />
          <TextInput label="Ani" type="number" value={form.years} onChange={e => setForm({...form, years: e.target.value})} />
          <Switch label="Permanent" checked={form.is_permanent} onChange={e => setForm({...form, is_permanent: e.currentTarget.checked})} />
          <TextInput label="Descriere" value={form.description} onChange={e => setForm({...form, description: e.target.value})} />
          <Group justify="flex-end"><Button variant="outline" onClick={close}>Anulează</Button><Button onClick={save} loading={saving}>Salvează</Button></Group>
        </Stack>
      </Modal>
    </div>
  );
}
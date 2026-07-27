'use client';

import { useState, useEffect } from 'react';
import { Title, Table, Button, Group, TextInput, Modal, Stack, ActionIcon, Alert } from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import { IconPlus, IconEdit, IconTrash } from '@tabler/icons-react';
import apiClient, { handleApiError } from '@/services/api';

export default function DocumentTypesPage() {
  const [items, setItems] = useState<any[]>([]);
  const [opened, { open, close }] = useDisclosure(false);
  const [editing, setEditing] = useState<any>(null);
  const [form, setForm] = useState({ name: '', code: '', description: '', retention_period: '' });
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  async function fetch() { try { const r = await apiClient.get('/api/v1/document-types'); setItems(r.data.data || []); } catch { } }
  useEffect(() => { fetch(); }, []);

  function openNew() { setEditing(null); setForm({ name: '', code: '', description: '', retention_period: '' }); setError(''); open(); }
  function openEdit(it: any) { setEditing(it); setForm({ name: it.name, code: it.code || '', description: it.description || '', retention_period: it.retention_period || '' }); setError(''); open(); }

  async function save() {
    setError(''); setSaving(true);
    try {
      if (editing) { await apiClient.put(`/api/v1/document-types/${editing.id}`, form); }
      else { await apiClient.post('/api/v1/document-types', form); }
      close(); fetch();
    } catch (err) { setError(handleApiError(err)); } finally { setSaving(false); }
  }

  async function del(it: any) { if (!confirm('Ștergeți?')) return; try { await apiClient.delete(`/api/v1/document-types/${it.id}`); fetch(); } catch { } }

  return (
    <div className="page-container">
      <Group justify="space-between" mb="md"><Title order={3}>Tipuri documente</Title><Button leftSection={<IconPlus size={16} />} onClick={openNew}>Adaugă</Button></Group>
      <Table>
        <Table.Thead><Table.Tr><Table.Th>Nume</Table.Th><Table.Th>Cod</Table.Th><Table.Th>Perioadă păstrare</Table.Th><Table.Th>Acțiuni</Table.Th></Table.Tr></Table.Thead>
        <Table.Tbody>{items.map(it => (
          <Table.Tr key={it.id}><Table.Td fw={500}>{it.name}</Table.Td><Table.Td>{it.code || '-'}</Table.Td><Table.Td>{it.retention_period || '-'}</Table.Td>
            <Table.Td><Group gap={4}><ActionIcon variant="subtle" color="blue" onClick={() => openEdit(it)}><IconEdit size={16} /></ActionIcon><ActionIcon variant="subtle" color="red" onClick={() => del(it)}><IconTrash size={16} /></ActionIcon></Group></Table.Td></Table.Tr>
        ))}</Table.Tbody>
      </Table>
      <Modal opened={opened} onClose={close} title={editing ? 'Editează' : 'Adaugă'}>
        {error && <Alert color="red" mb="md">{error}</Alert>}
        <Stack>
          <TextInput label="Nume" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} required />
          <TextInput label="Cod" value={form.code} onChange={e => setForm({ ...form, code: e.target.value })} />
          <TextInput label="Perioadă păstrare" value={form.retention_period} onChange={e => setForm({ ...form, retention_period: e.target.value })} />
          <Group justify="flex-end"><Button variant="outline" onClick={close}>Anulează</Button><Button onClick={save} loading={saving}>Salvează</Button></Group>
        </Stack>
      </Modal>
    </div>
  );
}
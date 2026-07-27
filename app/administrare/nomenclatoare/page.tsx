'use client';

import { useState, useEffect } from 'react';
import { Title, Table, Button, Group, TextInput, Select, Modal, Stack, ActionIcon, Alert, Badge } from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import { IconPlus, IconEdit, IconTrash } from '@tabler/icons-react';
import apiClient, { handleApiError } from '@/services/api';

const CATEGORIES = ['request_type', 'document_status', 'confidentiality', 'document_format'];

export default function NomenclaturesPage() {
  const [items, setItems] = useState<any[]>([]);
  const [opened, { open, close }] = useDisclosure(false);
  const [editing, setEditing] = useState<any>(null);
  const [form, setForm] = useState({ category: 'request_type', name: '', code: '', description: '' });
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);
  const [filterCat, setFilterCat] = useState<string | null>(null);

  async function fetch() {
    try {
      const params = filterCat ? `?category=${filterCat}` : '';
      const r = await apiClient.get(`/api/v1/nomenclatures${params}`);
      setItems(r.data.data || []);
    } catch { }
  }
  useEffect(() => { fetch(); }, [filterCat]);

  function openNew() { setEditing(null); setForm({ category: 'request_type', name: '', code: '', description: '' }); setError(''); open(); }
  function openEdit(it: any) { setEditing(it); setForm({ category: it.category, name: it.name, code: it.code || '', description: it.description || '' }); setError(''); open(); }

  async function save() {
    setError(''); setSaving(true);
    try {
      if (editing) { await apiClient.put(`/api/v1/nomenclatures/${editing.id}`, form); }
      else { await apiClient.post('/api/v1/nomenclatures', form); }
      close(); fetch();
    } catch (err) { setError(handleApiError(err)); } finally { setSaving(false); }
  }

  return (
    <div className="page-container">
      <Group justify="space-between" mb="md">
        <Title order={3}>Nomenclatoare</Title>
        <Group>
          <Select placeholder="Categorie" data={CATEGORIES.map(c => ({ value: c, label: c }))} clearable value={filterCat} onChange={setFilterCat} />
          <Button leftSection={<IconPlus size={16} />} onClick={openNew}>Adaugă</Button>
        </Group>
      </Group>
      <Table>
        <Table.Thead><Table.Tr><Table.Th>Categorie</Table.Th><Table.Th>Nume</Table.Th><Table.Th>Cod</Table.Th><Table.Th>Acțiuni</Table.Th></Table.Tr></Table.Thead>
        <Table.Tbody>{items.map(it => (
          <Table.Tr key={it.id}><Table.Td><Badge>{it.category}</Badge></Table.Td><Table.Td fw={500}>{it.name}</Table.Td><Table.Td>{it.code || '-'}</Table.Td>
            <Table.Td><Group gap={4}><ActionIcon variant="subtle" color="blue" onClick={() => openEdit(it)}><IconEdit size={16} /></ActionIcon></Group></Table.Td></Table.Tr>
        ))}</Table.Tbody>
      </Table>
      <Modal opened={opened} onClose={close} title={editing ? 'Editează' : 'Adaugă'}>
        {error && <Alert color="red" mb="md">{error}</Alert>}
        <Stack>
          <Select label="Categorie" data={CATEGORIES.map(c => ({ value: c, label: c }))} value={form.category} onChange={v => setForm({ ...form, category: v || 'request_type' })} />
          <TextInput label="Nume" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} required />
          <TextInput label="Cod" value={form.code} onChange={e => setForm({ ...form, code: e.target.value })} />
          <Group justify="flex-end"><Button variant="outline" onClick={close}>Anulează</Button><Button onClick={save} loading={saving}>Salvează</Button></Group>
        </Stack>
      </Modal>
    </div>
  );
}
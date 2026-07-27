'use client';

import { useState, useEffect, useCallback } from 'react';
import { Title, Paper, Table, Button, Group, TextInput, Badge, ActionIcon, Modal, Stack, Select, Alert } from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import { IconPlus, IconEdit, IconTrash } from '@tabler/icons-react';
import apiClient, { handleApiError } from '@/services/api';

export default function DepartmentsPage() {
  const [items, setItems] = useState<any[]>([]);
  const [opened, { open, close }] = useDisclosure(false);
  const [editing, setEditing] = useState<any>(null);
  const [form, setForm] = useState({ name: '', code: '', parent_id: '' });
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  const fetch = useCallback(async () => {
    try { const r = await apiClient.get('/api/v1/departments'); setItems(r.data.data || []); } catch { }
  }, []);

  useEffect(() => { fetch(); }, [fetch]);

  function openNew() { setEditing(null); setForm({ name: '', code: '', parent_id: '' }); setError(''); open(); }
  function openEdit(it: any) { setEditing(it); setForm({ name: it.name, code: it.code || '', parent_id: it.parent_id || '' }); setError(''); open(); }

  async function save() {
    setError(''); setSaving(true);
    try {
      if (editing) {
        await apiClient.put(`/api/v1/departments/${editing.id}`, form);
      } else {
        await apiClient.post('/api/v1/departments', form);
      }
      close(); fetch();
    } catch (err) { setError(handleApiError(err)); } finally { setSaving(false); }
  }

  async function del(it: any) {
    if (!confirm(`Ștergeți "${it.name}"?`)) return;
    try { await apiClient.delete(`/api/v1/departments/${it.id}`); fetch(); } catch { }
  }

  const parents = items.filter(i => i.level === 1).map(i => ({ value: i.id, label: i.name }));

  return (
    <div className="page-container">
      <Group justify="space-between" mb="md">
        <Title order={3}>Departamente</Title>
        <Button leftSection={<IconPlus size={16} />} onClick={openNew}>Adaugă</Button>
      </Group>
      <Table>
        <Table.Thead><Table.Tr><Table.Th>Nume</Table.Th><Table.Th>Cod</Table.Th><Table.Th>Nivel</Table.Th><Table.Th>Părinte</Table.Th><Table.Th>Acțiuni</Table.Th></Table.Tr></Table.Thead>
        <Table.Tbody>
          {items.map(it => (
            <Table.Tr key={it.id}>
              <Table.Td fw={500}>{it.name}</Table.Td>
              <Table.Td>{it.code || '-'}</Table.Td>
              <Table.Td><Badge variant="light">Nivel {it.level}</Badge></Table.Td>
              <Table.Td>{items.find(p => p.id === it.parent_id)?.name || '-'}</Table.Td>
              <Table.Td>
                <Group gap={4}>
                  <ActionIcon variant="subtle" color="blue" onClick={() => openEdit(it)}><IconEdit size={16} /></ActionIcon>
                  <ActionIcon variant="subtle" color="red" onClick={() => del(it)}><IconTrash size={16} /></ActionIcon>
                </Group>
              </Table.Td>
            </Table.Tr>
          ))}
        </Table.Tbody>
      </Table>
      <Modal opened={opened} onClose={close} title={editing ? 'Editează' : 'Adaugă'}>
        {error && <Alert color="red" mb="md">{error}</Alert>}
        <Stack>
          <TextInput label="Nume" value={form.name} onChange={e => setForm({...form, name: e.target.value})} required />
          <TextInput label="Cod" value={form.code} onChange={e => setForm({...form, code: e.target.value})} />
          <Select label="Părinte" data={parents} clearable value={form.parent_id} onChange={v => setForm({...form, parent_id: v || ''})} />
          <Group justify="flex-end"><Button variant="outline" onClick={close}>Anulează</Button><Button onClick={save} loading={saving}>Salvează</Button></Group>
        </Stack>
      </Modal>
    </div>
  );
}
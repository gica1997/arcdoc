'use client';

import { useState, useEffect } from 'react';
import {
  Title, Paper, Table, Button, Group, Badge, ActionIcon, Modal, Stack, TextInput, Textarea, MultiSelect, Alert,
} from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import { IconPlus, IconEdit, IconTrash } from '@tabler/icons-react';
import apiClient, { handleApiError } from '@/services/api';

interface RoleItem { id: string; name: string; slug: string; description?: string; is_system: boolean; permissions: { id: string; name: string; slug: string; module: string }[]; }
interface PermItem { id: string; name: string; slug: string; module: string; }

export default function RolesPage() {
  const [roles, setRoles] = useState<RoleItem[]>([]);
  const [perms, setPerms] = useState<PermItem[]>([]);
  const [opened, { open, close }] = useDisclosure(false);
  const [editing, setEditing] = useState<RoleItem | null>(null);
  const [form, setForm] = useState({ name: '', slug: '', description: '', permissionIds: [] as string[] });
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  async function fetchData() {
    try {
      const [r, p] = await Promise.all([
        apiClient.get('/api/v1/users/roles'),
        apiClient.get('/api/v1/users/permissions'),
      ]);
      setRoles(r.data.data || []);
      setPerms(p.data.data || []);
    } catch { }
  }

  useEffect(() => { fetchData(); }, []);

  function openNew() { setEditing(null); setForm({ name: '', slug: '', description: '', permissionIds: [] }); setError(''); open(); }
  function openEdit(r: RoleItem) { setEditing(r); setForm({ name: r.name, slug: r.slug, description: r.description || '', permissionIds: r.permissions.map(p => p.id) }); setError(''); open(); }

  async function save() {
    setError(''); setSaving(true);
    try {
      if (editing) {
        await apiClient.put(`/api/v1/users/roles/${editing.id}`, form);
      } else {
        await apiClient.post('/api/v1/users/roles', form);
      }
      close(); fetchData();
    } catch (err) { setError(handleApiError(err)); } finally { setSaving(false); }
  }

  async function deleteRole(r: RoleItem) {
    if (!confirm(`Ștergeți rolul "${r.name}"?`)) return;
    try { await apiClient.delete(`/api/v1/users/roles/${r.id}`); fetchData(); } catch { }
  }

  return (
    <div className="page-container">
      <Group justify="space-between" mb="md">
        <Title order={3}>Roluri</Title>
        <Button leftSection={<IconPlus size={16} />} onClick={openNew}>Adaugă rol</Button>
      </Group>

      <Table>
        <Table.Thead><Table.Tr><Table.Th>Nume</Table.Th><Table.Th>Slug</Table.Th><Table.Th>Permisiuni</Table.Th><Table.Th>Sistem</Table.Th><Table.Th>Acțiuni</Table.Th></Table.Tr></Table.Thead>
        <Table.Tbody>
          {roles.map(r => (
            <Table.Tr key={r.id}>
              <Table.Td fw={500}>{r.name}</Table.Td>
              <Table.Td><Badge variant="light">{r.slug}</Badge></Table.Td>
              <Table.Td>{r.permissions?.slice(0, 4).map(p => <Badge key={p.id} size="sm" mr={2}>{p.name}</Badge>)}{r.permissions?.length > 4 && <Badge size="sm">+{r.permissions.length - 4}</Badge>}</Table.Td>
              <Table.Td>{r.is_system ? <Badge color="orange">Sistem</Badge> : <Badge color="green">Personalizat</Badge>}</Table.Td>
              <Table.Td>
                <Group gap={4}>
                  <ActionIcon variant="subtle" color="blue" onClick={() => openEdit(r)}><IconEdit size={16} /></ActionIcon>
                  {!r.is_system && <ActionIcon variant="subtle" color="red" onClick={() => deleteRole(r)}><IconTrash size={16} /></ActionIcon>}
                </Group>
              </Table.Td>
            </Table.Tr>
          ))}
        </Table.Tbody>
      </Table>

      <Modal opened={opened} onClose={close} title={editing ? 'Editează rol' : 'Rol nou'} size="lg">
        {error && <Alert color="red" mb="md">{error}</Alert>}
        <Stack>
          <TextInput label="Nume" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
          <TextInput label="Slug" value={form.slug} onChange={(e) => setForm({ ...form, slug: e.target.value })} required disabled={!!editing?.is_system} />
          <Textarea label="Descriere" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
          <MultiSelect label="Permisiuni" data={perms.map(p => ({ value: p.id, label: `${p.name} (${p.module})` }))}
            value={form.permissionIds} onChange={(v) => setForm({ ...form, permissionIds: v })} searchable clearable />
          <Group justify="flex-end" mt="md">
            <Button variant="outline" onClick={close}>Anulează</Button>
            <Button onClick={save} loading={saving}>Salvează</Button>
          </Group>
        </Stack>
      </Modal>
    </div>
  );
}
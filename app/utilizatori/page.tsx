'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  Title, Paper, Table, Button, Group, TextInput, Select, Badge, ActionIcon, Modal,
  Stack, MultiSelect, PasswordInput, Alert, Pagination, Box, Grid,
} from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import { IconPlus, IconEdit, IconSearch, IconAlertCircle, IconRefresh, IconUserX, IconUserCheck } from '@tabler/icons-react';
import apiClient, { handleApiError } from '@/services/api';

interface UserItem { id: string; email: string; first_name: string; last_name: string; phone?: string; user_type: string; is_active: boolean; last_login_at?: string; created_at: string; roles: { id: string; name: string }[]; }
interface RoleItem { id: string; name: string; slug: string; }

export default function UsersPage() {
  const [users, setUsers] = useState<UserItem[]>([]);
  const [roles, setRoles] = useState<RoleItem[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [filterType, setFilterType] = useState<string | null>(null);
  const [filterActive, setFilterActive] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [opened, { open, close }] = useDisclosure(false);
  const [editing, setEditing] = useState<UserItem | null>(null);
  const [form, setForm] = useState({ email: '', password: '', firstName: '', lastName: '', phone: '', userType: 'intern', roleIds: [] as string[] });
  const [formError, setFormError] = useState('');
  const [saving, setSaving] = useState(false);

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      params.set('page', String(page)); params.set('limit', '20');
      if (search) params.set('search', search);
      if (filterType) params.set('userType', filterType);
      if (filterActive) params.set('isActive', filterActive);
      const res = await apiClient.get(`/api/v1/users?${params}`);
      setUsers(res.data.data || []);
      setTotal(res.data.meta?.total || 0);
    } catch { } finally { setLoading(false); }
  }, [page, search, filterType, filterActive]);

  const fetchRoles = async () => {
    try {
      const res = await apiClient.get('/api/v1/users/roles');
      setRoles(res.data.data || []);
    } catch { }
  };

  useEffect(() => { fetchUsers(); fetchRoles(); }, [fetchUsers]);

  function openNew() { setEditing(null); setForm({ email: '', password: '', firstName: '', lastName: '', phone: '', userType: 'intern', roleIds: [] }); setFormError(''); open(); }
  function openEdit(u: UserItem) { setEditing(u); setForm({ email: u.email, password: '', firstName: u.first_name, lastName: u.last_name, phone: u.phone || '', userType: u.user_type, roleIds: u.roles.map(r => r.id) }); setFormError(''); open(); }

  async function save() {
    setFormError(''); setSaving(true);
    try {
      if (editing) {
        await apiClient.put(`/api/v1/users/${editing.id}`, form);
      } else {
        await apiClient.post('/api/v1/users', form);
      }
      close(); fetchUsers();
    } catch (err) { setFormError(handleApiError(err)); } finally { setSaving(false); }
  }

  async function toggleActive(u: UserItem) {
    try { await apiClient.put(`/api/v1/users/${u.id}`, { isActive: !u.is_active }); fetchUsers(); } catch { }
  }

  return (
    <Box p="md">
      <Group justify="space-between" mb="md">
        <Title order={3}>Utilizatori</Title>
        <Group>
          <Button leftSection={<IconRefresh size={16} />} variant="outline" onClick={fetchUsers}>Refresh</Button>
          <Button leftSection={<IconPlus size={16} />} onClick={openNew}>Adaugă</Button>
        </Group>
      </Group>

      <Paper withBorder p="sm" mb="md">
        <Group>
          <TextInput placeholder="Caută..." leftSection={<IconSearch size={14} />} value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }} style={{ flex: 1 }} />
          <Select placeholder="Tip" data={[{ value: 'intern', label: 'Intern' }, { value: 'extern', label: 'Extern' }]}
            clearable value={filterType} onChange={(v) => { setFilterType(v); setPage(1); }} />
          <Select placeholder="Status" data={[{ value: 'true', label: 'Activ' }, { value: 'false', label: 'Inactiv' }]}
            clearable value={filterActive} onChange={(v) => { setFilterActive(v); setPage(1); }} />
        </Group>
      </Paper>

      <Table>
        <Table.Thead>
          <Table.Tr>
            <Table.Th>Nume</Table.Th><Table.Th>Email</Table.Th><Table.Th>Tip</Table.Th><Table.Th>Roluri</Table.Th><Table.Th>Status</Table.Th><Table.Th>Ultima autentificare</Table.Th><Table.Th>Acțiuni</Table.Th>
          </Table.Tr>
        </Table.Thead>
        <Table.Tbody>
          {users.map(u => (
            <Table.Tr key={u.id}>
              <Table.Td>{u.first_name} {u.last_name}</Table.Td>
              <Table.Td>{u.email}</Table.Td>
              <Table.Td><Badge color={u.user_type === 'intern' ? 'blue' : 'orange'}>{u.user_type === 'intern' ? 'Intern' : 'Extern'}</Badge></Table.Td>
              <Table.Td>{u.roles?.map((r, i) => <Badge key={i} size="sm" mr={4} variant="light">{r.name}</Badge>)}</Table.Td>
              <Table.Td><Badge color={u.is_active ? 'green' : 'red'}>{u.is_active ? 'Activ' : 'Inactiv'}</Badge></Table.Td>
              <Table.Td>{u.last_login_at ? new Date(u.last_login_at).toLocaleString('ro') : '-'}</Table.Td>
              <Table.Td>
                <Group gap={4}>
                  <ActionIcon variant="subtle" color="blue" onClick={() => openEdit(u)}><IconEdit size={16} /></ActionIcon>
                  <ActionIcon variant="subtle" color={u.is_active ? 'red' : 'green'} onClick={() => toggleActive(u)}>
                    {u.is_active ? <IconUserX size={16} /> : <IconUserCheck size={16} />}
                  </ActionIcon>
                </Group>
              </Table.Td>
            </Table.Tr>
          ))}
        </Table.Tbody>
      </Table>
      {total > 20 && <Pagination total={Math.ceil(total / 20)} value={page} onChange={setPage} mt="md" />}

      <Modal opened={opened} onClose={close} title={editing ? 'Editează utilizator' : 'Utilizator nou'} size="lg">
        {formError && <Alert icon={<IconAlertCircle size={16} />} color="red" mb="md">{formError}</Alert>}
        <Stack>
          <Grid>
            <Grid.Col span={6}><TextInput label="Prenume" value={form.firstName} onChange={(e) => setForm({ ...form, firstName: e.target.value })} required /></Grid.Col>
            <Grid.Col span={6}><TextInput label="Nume" value={form.lastName} onChange={(e) => setForm({ ...form, lastName: e.target.value })} required /></Grid.Col>
          </Grid>
          <TextInput label="Email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} required />
          {!editing && <PasswordInput label="Parolă" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} required />}
          <TextInput label="Telefon" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
          <Select label="Tip utilizator" data={[{ value: 'intern', label: 'Intern' }, { value: 'extern', label: 'Extern' }]}
            value={form.userType} onChange={(v) => setForm({ ...form, userType: v || 'intern' })} />
          <MultiSelect label="Roluri" data={roles.map(r => ({ value: r.id, label: r.name }))}
            value={form.roleIds} onChange={(v) => setForm({ ...form, roleIds: v })} />
          <Group justify="flex-end" mt="md">
            <Button variant="outline" onClick={close}>Anulează</Button>
            <Button onClick={save} loading={saving}>{editing ? 'Salvează' : 'Creează'}</Button>
          </Group>
        </Stack>
      </Modal>
    </Box>
  );
}
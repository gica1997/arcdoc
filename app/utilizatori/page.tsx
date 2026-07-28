'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  Title, Paper, Button, Group, TextInput, Select, Badge, ActionIcon, Modal,
  Stack, MultiSelect, PasswordInput, Alert, Pagination, Box, Text, Table, Tooltip,
} from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import {
  IconPlus, IconEdit, IconSearch, IconAlertCircle, IconRefresh,
  IconUserX, IconUserCheck, IconFilter, IconDotsVertical, IconUsers,
} from '@tabler/icons-react';
import apiClient, { handleApiError } from '@/services/api';
import { motion } from 'framer-motion';

interface UserItem {
  id: string; email: string; first_name: string; last_name: string;
  phone?: string; user_type: string; is_active: boolean;
  last_login_at?: string; created_at: string;
  roles: { id: string; name: string }[];
}
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
    try { const res = await apiClient.get('/api/v1/users/roles'); setRoles(res.data.data || []); } catch { }
  };

  useEffect(() => { fetchUsers(); fetchRoles(); }, [fetchUsers]);

  function openNew() {
    setEditing(null);
    setForm({ email: '', password: '', firstName: '', lastName: '', phone: '', userType: 'intern', roleIds: [] });
    setFormError(''); open();
  }
  function openEdit(u: UserItem) {
    setEditing(u);
    setForm({ email: u.email, password: '', firstName: u.first_name, lastName: u.last_name, phone: u.phone || '', userType: u.user_type, roleIds: u.roles.map(r => r.id) });
    setFormError(''); open();
  }

  async function save() {
    setFormError(''); setSaving(true);
    try {
      if (editing) await apiClient.put(`/api/v1/users/${editing.id}`, form);
      else await apiClient.post('/api/v1/users', form);
      close(); fetchUsers();
    } catch (err) { setFormError(handleApiError(err)); } finally { setSaving(false); }
  }

  async function toggleActive(u: UserItem) {
    try { await apiClient.put(`/api/v1/users/${u.id}`, { isActive: !u.is_active }); fetchUsers(); } catch { }
  }

  return (
    <div className="page-container animate-fade-in">
      {/* Header */}
      <Box mb="xl">
        <Group justify="space-between">
          <Box>
            <Text size="xs" tt="uppercase" fw={600} c="dimmed" mb={4}>Management</Text>
            <Title order={3} fw={700}>Utilizatori</Title>
            <Text c="dimmed" size="sm">Gestionați utilizatorii platformei</Text>
          </Box>
          <Group>
            <Button variant="default" leftSection={<IconRefresh size={16} />} onClick={fetchUsers} loading={loading}>
              Actualizare
            </Button>
            <Button leftSection={<IconPlus size={16} />} onClick={openNew}>
              Utilizator nou
            </Button>
          </Group>
        </Group>
      </Box>

      {/* Filters */}
      <Paper p="md" mb="md" radius="lg" withBorder>
        <Group>
          <TextInput
            placeholder="Caută utilizatori..."
            leftSection={<IconSearch size={14} />}
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            style={{ flex: 1 }}
            styles={{
              input: {
                background: 'var(--arcdoc-surface)',
                border: '1px solid var(--arcdoc-border)',
                borderRadius: 'var(--arcdoc-radius-md)',
              },
            }}
          />
          <Select
            placeholder="Tip"
            data={[{ value: 'intern', label: 'Intern' }, { value: 'extern', label: 'Extern' }]}
            clearable value={filterType} onChange={(v) => { setFilterType(v); setPage(1); }}
            styles={{ input: { background: 'var(--arcdoc-surface)', border: '1px solid var(--arcdoc-border)' } }}
          />
          <Select
            placeholder="Status"
            data={[{ value: 'true', label: 'Activ' }, { value: 'false', label: 'Inactiv' }]}
            clearable value={filterActive} onChange={(v) => { setFilterActive(v); setPage(1); }}
            styles={{ input: { background: 'var(--arcdoc-surface)', border: '1px solid var(--arcdoc-border)' } }}
          />
        </Group>
      </Paper>

      {/* Table */}
      <Paper radius="lg" withBorder style={{ overflow: 'hidden' }}>
        <div style={{ overflowX: 'auto' }}>
          <table className="arcdoc-table">
            <thead>
              <tr>
                <th>Nume</th><th>Email</th><th>Tip</th><th>Roluri</th><th>Status</th><th>Ultima autentificare</th><th style={{ width: 80 }}>Acțiuni</th>
              </tr>
            </thead>
            <tbody>
              {users.length === 0 ? (
                <tr>
                  <td colSpan={7}>
                    <div className="empty-state">
                      <IconUsers size={48} className="empty-state-icon" />
                      <div className="empty-state-title">Niciun utilizator găsit</div>
                      <div className="empty-state-description">Nu există utilizatori care să corespundă criteriilor de căutare.</div>
                      <Button variant="light" onClick={openNew}>Adaugă utilizator</Button>
                    </div>
                  </td>
                </tr>
              ) : (
                users.map((u, idx) => (
                  <motion.tr
                    key={u.id}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: idx * 0.03 }}
                  >
                    <td>
                      <Group gap="sm">
                        <div style={{
                          width: 28, height: 28, borderRadius: '50%',
                          background: u.is_active ? 'var(--arcdoc-primary-100)' : 'var(--arcdoc-neutral-200)',
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          fontSize: '0.75rem', fontWeight: 600,
                          color: u.is_active ? 'var(--arcdoc-primary-600)' : 'var(--arcdoc-text-secondary)',
                        }}>
                          {u.first_name?.[0]}{u.last_name?.[0]}
                        </div>
                        <Text fw={500} size="sm">{u.first_name} {u.last_name}</Text>
                      </Group>
                    </td>
                    <td><Text size="sm">{u.email}</Text></td>
                    <td>
                      <Badge color={u.user_type === 'intern' ? 'arcdoc-primary' : 'arcdoc-accent'} variant="light" size="sm">
                        {u.user_type === 'intern' ? 'Intern' : 'Extern'}
                      </Badge>
                    </td>
                    <td>
                      <Group gap={4}>
                        {u.roles?.map((r, i) => (
                          <Badge key={i} size="sm" variant="light" color="gray">{r.name}</Badge>
                        ))}
                        {(!u.roles || u.roles.length === 0) && <Text size="xs" c="dimmed">-</Text>}
                      </Group>
                    </td>
                    <td>
                      <Badge color={u.is_active ? 'arcdoc-success' : 'arcdoc-danger'} variant="dot" size="sm">
                        {u.is_active ? 'Activ' : 'Inactiv'}
                      </Badge>
                    </td>
                    <td><Text size="sm" c="dimmed">{u.last_login_at ? new Date(u.last_login_at).toLocaleString('ro') : '-'}</Text></td>
                    <td>
                      <Group gap={4}>
                        <Tooltip label="Editează">
                          <ActionIcon variant="subtle" color="gray" size="md" onClick={() => openEdit(u)}>
                            <IconEdit size={16} />
                          </ActionIcon>
                        </Tooltip>
                        <Tooltip label={u.is_active ? 'Dezactivează' : 'Activează'}>
                          <ActionIcon variant="subtle" color={u.is_active ? 'red' : 'green'} size="md" onClick={() => toggleActive(u)}>
                            {u.is_active ? <IconUserX size={16} /> : <IconUserCheck size={16} />}
                          </ActionIcon>
                        </Tooltip>
                      </Group>
                    </td>
                  </motion.tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        {total > 20 && (
          <Box p="md" style={{ borderTop: '1px solid var(--arcdoc-border)' }}>
            <Group justify="space-between">
              <Text size="sm" c="dimmed">{total} utilizatori în total</Text>
              <Pagination total={Math.ceil(total / 20)} value={page} onChange={setPage} />
            </Group>
          </Box>
        )}
      </Paper>

      {/* Modal */}
      <Modal
        opened={opened}
        onClose={close}
        title={editing ? 'Editează utilizator' : 'Utilizator nou'}
        size="lg"
      >
        {formError && <Alert icon={<IconAlertCircle size={16} />} color="red" mb="md" styles={{ root: { borderRadius: 'var(--arcdoc-radius-md)' } }}>{formError}</Alert>}
        <Stack>
          <Group grow>
            <TextInput label="Prenume" value={form.firstName} onChange={(e) => setForm({ ...form, firstName: e.target.value })} required />
            <TextInput label="Nume" value={form.lastName} onChange={(e) => setForm({ ...form, lastName: e.target.value })} required />
          </Group>
          <TextInput label="Email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} required />
          {!editing && <PasswordInput label="Parolă" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} required />}
          <TextInput label="Telefon" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
          <Select label="Tip utilizator" data={[{ value: 'intern', label: 'Intern' }, { value: 'extern', label: 'Extern' }]} value={form.userType} onChange={(v) => setForm({ ...form, userType: v || 'intern' })} />
          <MultiSelect label="Roluri" data={roles.map(r => ({ value: r.id, label: r.name }))} value={form.roleIds} onChange={(v) => setForm({ ...form, roleIds: v })} />
          <Group justify="flex-end" mt="md">
            <Button variant="default" onClick={close}>Anulează</Button>
            <Button onClick={save} loading={saving}>{editing ? 'Salvează' : 'Creează'}</Button>
          </Group>
        </Stack>
      </Modal>
    </div>
  );
}

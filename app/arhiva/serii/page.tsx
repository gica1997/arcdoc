'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  Title, Paper, Button, Group, TextInput, Badge, ActionIcon, Modal, Stack, Alert,
  Textarea, Box, Text, SimpleGrid, Select,
} from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import { IconPlus, IconEdit, IconTrash, IconSearch, IconListTree, IconRefresh, IconAlertCircle } from '@tabler/icons-react';
import apiClient, { handleApiError } from '@/services/api';
import { motion } from 'framer-motion';

export default function SeriesPage() {
  const [items, setItems] = useState<any[]>([]);
  const [funds, setFunds] = useState<any[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(false);
  const [opened, { open, close }] = useDisclosure(false);
  const [editing, setEditing] = useState<any>(null);
  const [form, setForm] = useState({ name: '', code: '', fund_id: '', description: '' });
  const [formError, setFormError] = useState('');
  const [saving, setSaving] = useState(false);

  const fetch = useCallback(async () => {
    setLoading(true);
    try { const r = await apiClient.get(`/api/v1/series${search ? `?search=${search}` : ''}`); setItems(r.data.data || []); }
    catch {} finally { setLoading(false); }
  }, [search]);

  useEffect(() => { fetch(); apiClient.get('/api/v1/archive-funds').then(r => setFunds(r.data.data || [])).catch(() => {}); }, [fetch]);

  function openNew() { setEditing(null); setForm({ name: '', code: '', fund_id: '', description: '' }); setFormError(''); open(); }
  function openEdit(it: any) { setEditing(it); setForm({ name: it.name, code: it.code, fund_id: it.fund_id || '', description: it.description || '' }); setFormError(''); open(); }

  async function save() {
    setFormError(''); setSaving(true);
    try {
      if (editing) await apiClient.put(`/api/v1/series/${editing.id}`, form);
      else await apiClient.post('/api/v1/series', form);
      close(); fetch();
    } catch (err) { setFormError(handleApiError(err)); } finally { setSaving(false); }
  }

  async function del(it: any) {
    if (!confirm(`Ștergeți seria "${it.name}"?`)) return;
    try { await apiClient.delete(`/api/v1/series/${it.id}`); fetch(); } catch {}
  }

  return (
    <div className="page-container animate-fade-in">
      <Box mb="xl">
        <Group justify="space-between">
          <Box>
            <Text size="xs" tt="uppercase" fw={600} c="dimmed" mb={4}>Arhivă</Text>
            <Title order={3} fw={700}>Serii documente</Title>
            <Text c="dimmed" size="sm">Gestionați seriile documentelor arhivate</Text>
          </Box>
          <Button leftSection={<IconPlus size={16} />} onClick={openNew}>Serie nouă</Button>
        </Group>
      </Box>

      <TextInput placeholder="Caută serii..." leftSection={<IconSearch size={14} />} value={search}
        onChange={e => setSearch(e.target.value)} mb="md" style={{ maxWidth: 400 }} />

      <SimpleGrid cols={{ base: 1, sm: 2, lg: 3 }} spacing="md">
        {items.length === 0 ? (
          <Paper p="xl" radius="lg" withBorder style={{ gridColumn: '1/-1' }}>
            <div className="empty-state">
              <IconListTree size={48} className="empty-state-icon" />
              <div className="empty-state-title">Nicio serie</div>
              <Button variant="light" onClick={openNew}>Adaugă serie</Button>
            </div>
          </Paper>
        ) : items.map((it, idx) => (
          <motion.div key={it.id} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: idx * 0.03 }}>
            <Paper p="lg" radius="lg" withBorder className="arcdoc-card">
              <Group justify="space-between" mb="xs">
                <Badge color="arcdoc-accent" variant="light">{it.code || '-'}</Badge>
                <Group gap={4}>
                  <ActionIcon variant="subtle" color="gray" size="sm" onClick={() => openEdit(it)}><IconEdit size={14} /></ActionIcon>
                  <ActionIcon variant="subtle" color="red" size="sm" onClick={() => del(it)}><IconTrash size={14} /></ActionIcon>
                </Group>
              </Group>
              <Text fw={600} size="md">{it.name}</Text>
              <Text size="sm" c="dimmed" lineClamp={2}>{it.description || 'Fără descriere'}</Text>
              {it.fund_name && <Badge size="sm" variant="light" color="gray" mt="sm">{it.fund_name}</Badge>}
              {it.document_count !== undefined && <Text size="xs" c="dimmed" mt="xs">{it.document_count} documente</Text>}
            </Paper>
          </motion.div>
        ))}
      </SimpleGrid>

      <Modal opened={opened} onClose={close} title={editing ? 'Editează serie' : 'Serie nouă'}>
        {formError && <Alert icon={<IconAlertCircle size={16} />} color="red" mb="md">{formError}</Alert>}
        <Stack>
          <TextInput label="Denumire" value={form.name} onChange={e => setForm({...form, name: e.target.value})} required />
          <TextInput label="Cod" value={form.code} onChange={e => setForm({...form, code: e.target.value})} />
          <Select label="Fond arhivistic" data={funds.map(f => ({ value: f.id, label: f.name }))} clearable searchable
            value={form.fund_id} onChange={v => setForm({...form, fund_id: v || ''})} />
          <Textarea label="Descriere" value={form.description} onChange={e => setForm({...form, description: e.target.value})} />
          <Group justify="flex-end">
            <Button variant="default" onClick={close}>Anulează</Button>
            <Button onClick={save} loading={saving}>{editing ? 'Salvează' : 'Creează'}</Button>
          </Group>
        </Stack>
      </Modal>
    </div>
  );
}

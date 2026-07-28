'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  Title, Paper, Button, Group, TextInput, Select, Badge, ActionIcon, Modal, Stack, Alert,
  Pagination, Textarea, Box, Text, Tabs,
} from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import {
  IconPlus, IconEdit, IconTrash, IconSearch, IconFileText, IconRefresh, IconAlertCircle,
} from '@tabler/icons-react';
import { useRouter } from 'next/navigation';
import apiClient, { handleApiError } from '@/services/api';
import { motion } from 'framer-motion';

export default function DocumentsPage() {
  const router = useRouter();
  const [items, setItems] = useState<any[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [filterFund, setFilterFund] = useState<string | null>(null);
  const [filterType, setFilterType] = useState<string | null>(null);
  const [filterStatus, setFilterStatus] = useState<string | null>(null);
  const [filterFormat, setFilterFormat] = useState<string | null>(null);
  const [funds, setFunds] = useState<any[]>([]);
  const [docTypes, setDocTypes] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  const [opened, { open, close }] = useDisclosure(false);
  const [editing, setEditing] = useState<any>(null);
  const [form, setForm] = useState<Record<string, any>>({ title: '', code: '', number: '', document_type: '', description: '', format: 'physical', status: 'available', confidentiality_level: 'public', fund_id: '', series_id: '', department_id: '', tags: [] as string[] });
  const [formError, setFormError] = useState('');
  const [saving, setSaving] = useState(false);

  const fetch = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      params.set('page', String(page)); params.set('limit', '20');
      if (search) params.set('search', search);
      if (filterFund) params.set('fund_id', filterFund);
      if (filterType) params.set('type_id', filterType);
      if (filterStatus) params.set('status', filterStatus);
      if (filterFormat) params.set('format', filterFormat);
      const r = await apiClient.get(`/api/v1/documents?${params}`);
      setItems(r.data.data || []);
      setTotal(r.data.meta?.total || 0);
    } catch { } finally { setLoading(false); }
  }, [page, search, filterFund, filterType, filterStatus, filterFormat]);

  useEffect(() => {
    fetch();
    apiClient.get('/api/v1/archive-funds').then(r => setFunds(r.data.data || [])).catch(() => {});
    apiClient.get('/api/v1/document-types').then(r => setDocTypes(r.data.data || [])).catch(() => {});
  }, [fetch]);

  function openNew() { setEditing(null); setForm({ title: '', code: '', number: '', document_type: '', description: '', format: 'physical', status: 'available', confidentiality_level: 'public', fund_id: '', series_id: '', department_id: '', tags: [] }); setFormError(''); open(); }
  function openEdit(it: any) {
    setEditing(it);
    setForm({ title: it.title, code: it.code, number: it.number || '', document_type: it.document_type || '', description: it.description || '', format: it.format || 'physical', status: it.status || 'available', confidentiality_level: it.confidentiality_level || 'public', fund_id: it.fund_id || '', series_id: it.series_id || '', department_id: it.department_id || '', tags: it.tags || [] });
    setFormError(''); open();
  }

  async function save() {
    setFormError(''); setSaving(true);
    try {
      if (editing) { await apiClient.put(`/api/v1/documents/${editing.id}`, form); }
      else { await apiClient.post('/api/v1/documents', form); }
      close(); fetch();
    } catch (err) { setFormError(handleApiError(err)); } finally { setSaving(false); }
  }

  async function del(it: any) {
    if (!confirm(`Ștergeți documentul "${it.title}"?`)) return;
    try { await apiClient.delete(`/api/v1/documents/${it.id}`); fetch(); } catch { }
  }

  const formFields = (key: string) => ({ value: form[key] || '', onChange: (e: any) => setForm({ ...form, [key]: e.target?.value ?? e }) });

  return (
    <div className="page-container animate-fade-in">
      <Box mb="xl">
        <Group justify="space-between">
          <Box>
            <Text size="xs" tt="uppercase" fw={600} c="dimmed" mb={4}>Arhivă</Text>
            <Title order={3} fw={700}>Documente arhivă</Title>
            <Text c="dimmed" size="sm">Gestionați documentele fizice și digitale</Text>
          </Box>
          <Button leftSection={<IconPlus size={16} />} onClick={openNew}>Document nou</Button>
        </Group>
      </Box>

      <Paper p="md" mb="md" radius="lg" withBorder>
        <Group>
          <TextInput placeholder="Caută documente..." leftSection={<IconSearch size={14} />} value={search}
            onChange={e => { setSearch(e.target.value); setPage(1); }} style={{ flex: 1 }} />
          <Select placeholder="Fond" data={funds.map(f => ({ value: f.id, label: f.name }))} clearable searchable value={filterFund} onChange={v => { setFilterFund(v); setPage(1); }} />
          <Select placeholder="Tip" data={docTypes.map(t => ({ value: t.code, label: t.name }))} clearable value={filterType} onChange={v => { setFilterType(v); setPage(1); }} />
          <Select placeholder="Status" data={[{ value: 'available', label: 'Disponibil' }, { value: 'borrowed', label: 'Împrumutat' }, { value: 'archived', label: 'Arhivat' }]} clearable value={filterStatus} onChange={v => { setFilterStatus(v); setPage(1); }} />
          <Select placeholder="Format" data={[{ value: 'physical', label: 'Fizic' }, { value: 'digital', label: 'Digital' }]} clearable value={filterFormat} onChange={v => { setFilterFormat(v); setPage(1); }} />
        </Group>
      </Paper>

      <Paper radius="lg" withBorder style={{ overflow: 'hidden' }}>
        <div style={{ overflowX: 'auto' }}>
          <table className="arcdoc-table">
            <thead>
              <tr><th>Nr.</th><th>Titlu</th><th>Tip</th><th>Fond</th><th>Format</th><th>Status</th><th>Acțiuni</th></tr>
            </thead>
            <tbody>
              {items.length === 0 ? (
                <tr><td colSpan={7}>
                  <div className="empty-state">
                    <IconFileText size={48} className="empty-state-icon" />
                    <div className="empty-state-title">Niciun document găsit</div>
                    <div className="empty-state-description">Nu există documente care să corespundă criteriilor.</div>
                    <Button variant="light" onClick={openNew}>Adaugă document</Button>
                  </div>
                </td></tr>
              ) : items.map((it, idx) => (
                <motion.tr key={it.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: idx * 0.03 }}
                  style={{ cursor: 'pointer' }} onClick={() => router.push(`/arhiva/documente/${it.id}`)}>
                  <td><Badge variant="light">{it.code || it.number || '-'}</Badge></td>
                  <td><Text fw={500} size="sm">{it.title}</Text></td>
                  <td><Badge color="blue" variant="light" size="sm">{it.type_name || it.document_type}</Badge></td>
                  <td><Text size="sm">{it.fund_name || '-'}</Text></td>
                  <td><Badge color={it.format === 'digital' ? 'arcdoc-accent' : 'gray'} size="sm">{it.format === 'digital' ? 'Digital' : 'Fizic'}</Badge></td>
                  <td>
                    <Badge color={it.status === 'available' ? 'arcdoc-success' : it.status === 'borrowed' ? 'arcdoc-warning' : 'arcdoc-danger'} variant="dot" size="sm">
                      {it.status === 'available' ? 'Disponibil' : it.status === 'borrowed' ? 'Împrumutat' : 'Arhivat'}
                    </Badge>
                  </td>
                  <td>
                    <Group gap={4} onClick={e => e.stopPropagation()}>
                      <ActionIcon variant="subtle" color="gray" onClick={() => openEdit(it)}><IconEdit size={16} /></ActionIcon>
                      <ActionIcon variant="subtle" color="red" onClick={() => del(it)}><IconTrash size={16} /></ActionIcon>
                    </Group>
                  </td>
                </motion.tr>
              ))}
            </tbody>
          </table>
        </div>
        {total > 20 && (
          <Box p="md" style={{ borderTop: '1px solid var(--arcdoc-border)' }}>
            <Group justify="space-between">
              <Text size="sm" c="dimmed">{total} documente în total</Text>
              <Pagination total={Math.ceil(total / 20)} value={page} onChange={setPage} />
            </Group>
          </Box>
        )}
      </Paper>

      <Modal opened={opened} onClose={close} title={editing ? 'Editează document' : 'Document nou'} size="xl">
        {formError && <Alert icon={<IconAlertCircle size={16} />} color="red" mb="md">{formError}</Alert>}
        <Tabs defaultValue="general">
          <Tabs.List>
            <Tabs.Tab value="general">General</Tabs.Tab>
            <Tabs.Tab value="classification">Clasificare</Tabs.Tab>
            <Tabs.Tab value="physical">Localizare</Tabs.Tab>
          </Tabs.List>
          <Tabs.Panel value="general" pt="md">
            <Stack>
              <Group grow>
                <TextInput label="Titlu" {...formFields('title')} required />
                <TextInput label="Număr" {...formFields('number')} />
              </Group>
              <Group grow>
                <TextInput label="Cod" {...formFields('code')} />
                <Select label="Tip document" data={docTypes.map(t => ({ value: t.code, label: t.name }))} {...formFields('document_type')} />
              </Group>
              <Textarea label="Descriere" {...formFields('description')} />
              <Group grow>
                <Select label="Format" data={[{ value: 'physical', label: 'Fizic' }, { value: 'digital', label: 'Digital' }]} {...formFields('format')} />
                <Select label="Status" data={[{ value: 'available', label: 'Disponibil' }, { value: 'borrowed', label: 'Împrumutat' }, { value: 'archived', label: 'Arhivat' }]} {...formFields('status')} />
              </Group>
            </Stack>
          </Tabs.Panel>
          <Tabs.Panel value="classification" pt="md">
            <Stack>
              <Select label="Fond arhivistic" data={funds.map(f => ({ value: f.id, label: f.name }))} clearable searchable {...formFields('fund_id')} />
              <TextInput label="Departament" {...formFields('department_id')} />
            </Stack>
          </Tabs.Panel>
          <Tabs.Panel value="physical" pt="md">
            <Stack>
              <TextInput label="Locație arhivă" {...formFields('archive_location_id')} />
              <Textarea label="Observații" {...formFields('observations')} />
            </Stack>
          </Tabs.Panel>
        </Tabs>
        <Group justify="flex-end" mt="md">
          <Button variant="default" onClick={close}>Anulează</Button>
          <Button onClick={save} loading={saving}>{editing ? 'Salvează' : 'Creează'}</Button>
        </Group>
      </Modal>
    </div>
  );
}

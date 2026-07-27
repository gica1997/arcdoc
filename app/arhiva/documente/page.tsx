'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  Title, Table, Button, Group, TextInput, Select, Badge, ActionIcon, Modal, Stack, Alert,
  Pagination, Paper, MultiSelect, Textarea, Box, Tabs, Grid,
} from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import {
  IconPlus, IconEdit, IconTrash, IconSearch, IconFile, IconDownload, IconStar, IconStarFilled, IconMessage,
} from '@tabler/icons-react';
import { useRouter } from 'next/navigation';
import apiClient, { handleApiError } from '@/services/api';

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
    setForm({
      title: it.title, code: it.code, number: it.number || '', document_type: it.document_type || '',
      description: it.description || '', format: it.format || 'physical', status: it.status || 'available',
      confidentiality_level: it.confidentiality_level || 'public', fund_id: it.fund_id || '',
      series_id: it.series_id || '', department_id: it.department_id || '', tags: it.tags || [],
    });
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
    <div className="page-container">
      <Group justify="space-between" mb="md">
        <Title order={3}>Documente</Title>
        <Button leftSection={<IconPlus size={16} />} onClick={openNew}>Document nou</Button>
      </Group>

      <Paper withBorder p="sm" mb="md">
        <Group>
          <TextInput placeholder="Caută..." leftSection={<IconSearch size={14} />} value={search}
            onChange={e => { setSearch(e.target.value); setPage(1); }} style={{ flex: 1 }} />
          <Select placeholder="Fond" data={funds.map(f => ({ value: f.id, label: f.name }))} clearable searchable value={filterFund} onChange={v => { setFilterFund(v); setPage(1); }} />
          <Select placeholder="Tip" data={docTypes.map(t => ({ value: t.code, label: t.name }))} clearable value={filterType} onChange={v => { setFilterType(v); setPage(1); }} />
          <Select placeholder="Status" data={[{ value: 'available', label: 'Disponibil' }, { value: 'borrowed', label: 'Împrumutat' }, { value: 'archived', label: 'Arhivat' }]} clearable value={filterStatus} onChange={v => { setFilterStatus(v); setPage(1); }} />
          <Select placeholder="Format" data={[{ value: 'physical', label: 'Fizic' }, { value: 'digital', label: 'Digital' }]} clearable value={filterFormat} onChange={v => { setFilterFormat(v); setPage(1); }} />
        </Group>
      </Paper>

      <Table>
        <Table.Thead>
          <Table.Tr><Table.Th>Nr.</Table.Th><Table.Th>Titlu</Table.Th><Table.Th>Tip</Table.Th><Table.Th>Fond</Table.Th><Table.Th>Format</Table.Th><Table.Th>Status</Table.Th><Table.Th>Acțiuni</Table.Th></Table.Tr>
        </Table.Thead>
        <Table.Tbody>
          {items.map(it => (
            <Table.Tr key={it.id} style={{ cursor: 'pointer' }} onClick={() => router.push(`/arhiva/documente/${it.id}`)}>
              <Table.Td><Badge variant="light">{it.code || it.number || '-'}</Badge></Table.Td>
              <Table.Td fw={500}>{it.title}</Table.Td>
              <Table.Td><Badge color="blue">{it.type_name || it.document_type}</Badge></Table.Td>
              <Table.Td>{it.fund_name || '-'}</Table.Td>
              <Table.Td><Badge color={it.format === 'digital' ? 'cyan' : 'gray'}>{it.format}</Badge></Table.Td>
              <Table.Td><Badge color={it.status === 'available' ? 'green' : it.status === 'borrowed' ? 'orange' : 'red'}>{it.status}</Badge></Table.Td>
              <Table.Td>
                <Group gap={4} onClick={e => e.stopPropagation()}>
                  <ActionIcon variant="subtle" color="blue" onClick={() => openEdit(it)}><IconEdit size={16} /></ActionIcon>
                  <ActionIcon variant="subtle" color="red" onClick={() => del(it)}><IconTrash size={16} /></ActionIcon>
                  {it.primary_file && <ActionIcon variant="subtle" color="cyan"><IconDownload size={16} /></ActionIcon>}
                </Group>
              </Table.Td>
            </Table.Tr>
          ))}
        </Table.Tbody>
      </Table>
      {total > 20 && <Pagination total={Math.ceil(total / 20)} value={page} onChange={setPage} mt="md" />}

      <Modal opened={opened} onClose={close} title={editing ? 'Editează document' : 'Document nou'} size="xl">
        {formError && <Alert color="red" mb="md">{formError}</Alert>}
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
              <Select label="Confidențialitate" data={[{ value: 'public', label: 'Public' }, { value: 'restricted', label: 'Restricționat' }, { value: 'confidential', label: 'Confidențial' }]} {...formFields('confidentiality_level')} />
            </Stack>
          </Tabs.Panel>
          <Tabs.Panel value="classification" pt="md">
            <Stack>
              <Select label="Fond arhivistic" data={funds.map(f => ({ value: f.id, label: f.name }))} clearable searchable {...formFields('fund_id')} />
              <TextInput label="Departament" {...formFields('department_id')} />
              <MultiSelect label="Etichete" data={[]} {...formFields('tags')} searchable />
            </Stack>
          </Tabs.Panel>
          <Tabs.Panel value="physical" pt="md">
            <Stack>
              <TextInput label="Locație arhivă (ID)" {...formFields('archive_location_id')} />
              <Textarea label="Observații" {...formFields('observations')} />
            </Stack>
          </Tabs.Panel>
        </Tabs>
        <Group justify="flex-end" mt="md">
          <Button variant="outline" onClick={close}>Anulează</Button>
          <Button onClick={save} loading={saving}>{editing ? 'Salvează' : 'Creează'}</Button>
        </Group>
      </Modal>
    </div>
  );
}
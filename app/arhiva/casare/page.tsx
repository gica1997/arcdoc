'use client';

import { useState, useEffect, useCallback } from 'react';
import { Title, Table, Button, Group, TextInput, Select, Badge, ActionIcon, Modal, Stack, Alert } from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import { IconPlus, IconCheck } from '@tabler/icons-react';
import apiClient, { handleApiError } from '@/services/api';

export default function DisposalPage() {
  const [items, setItems] = useState<any[]>([]);
  const [docs, setDocs] = useState<any[]>([]);
  const [statusFilter, setStatusFilter] = useState<string | null>(null);
  const [opened, { open, close }] = useDisclosure(false);
  const [form, setForm] = useState({ document_id: '', reason: '', notes: '' });
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  const fetch = useCallback(async () => {
    try {
      const params = statusFilter ? `?status=${statusFilter}` : '';
      const r = await apiClient.get(`/api/v1/disposal${params}`);
      setItems(r.data.data || []);
    } catch { }
  }, [statusFilter]);

  useEffect(() => { fetch(); apiClient.get('/api/v1/documents?limit=100').then(r=>setDocs(r.data.data||[])).catch(()=>{}); }, [fetch]);

  async function save() { setError(''); setSaving(true); try { await apiClient.post('/api/v1/disposal', form); close(); fetch(); } catch (err) { setError(handleApiError(err)); } finally { setSaving(false); } }
  async function approve(id: string) { try { await apiClient.put(`/api/v1/disposal/${id}`, { status: 'approved' }); fetch(); } catch { } }

  const statusColor: Record<string,string> = { draft: 'gray', proposed: 'blue', approved: 'green', rejected: 'red', eliminated: 'orange' };

  return (
    <div className="page-container">
      <Group justify="space-between" mb="md"><Title order={3}>Casări</Title><Button leftSection={<IconPlus size={16} />} onClick={open}>Propunere nouă</Button></Group>
      <Group mb="md"><Select placeholder="Status" data={[{value:'proposed',label:'Propus'},{value:'approved',label:'Aprobat'},{value:'eliminated',label:'Eliminat'}]} clearable value={statusFilter} onChange={setStatusFilter} /></Group>
      <Table>
        <Table.Thead><Table.Tr><Table.Th>Nr. proces</Table.Th><Table.Th>Document</Table.Th><Table.Th>Motiv</Table.Th><Table.Th>Status</Table.Th><Table.Th>Acțiuni</Table.Th></Table.Tr></Table.Thead>
        <Table.Tbody>{items.map(it=>(
          <Table.Tr key={it.id}><Table.Td><Badge variant="light">{it.process_number}</Badge></Table.Td><Table.Td fw={500}>{it.document_title||it.document_code||'-'}</Table.Td><Table.Td>{it.reason}</Table.Td>
            <Table.Td><Badge color={statusColor[it.status]||'gray'}>{it.status}</Badge></Table.Td>
            <Table.Td>{it.status==='proposed' && <ActionIcon variant="subtle" color="green" onClick={()=>approve(it.id)}><IconCheck size={16}/></ActionIcon>}</Table.Td>
          </Table.Tr>
        ))}</Table.Tbody>
      </Table>
      <Modal opened={opened} onClose={close} title="Propunere casare">
        {error && <Alert color="red" mb="md">{error}</Alert>}
        <Stack>
          <Select label="Document" data={docs.map((d:any)=>({value:d.id,label:d.title}))} searchable value={form.document_id} onChange={v=>setForm({...form,document_id:v||''})} required />
          <TextInput label="Motiv" value={form.reason} onChange={e=>setForm({...form,reason:e.target.value})} required />
          <TextInput label="Observații" value={form.notes} onChange={e=>setForm({...form,notes:e.target.value})} />
          <Group justify="flex-end"><Button variant="outline" onClick={close}>Anulează</Button><Button onClick={save} loading={saving}>Trimite</Button></Group>
        </Stack>
      </Modal>
    </div>
  );
}
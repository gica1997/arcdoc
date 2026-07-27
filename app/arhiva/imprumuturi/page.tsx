'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  Title, Table, Button, Group, TextInput, Select, Badge, ActionIcon, Modal, Stack, Alert, Paper,
} from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import { IconPlus, IconEdit, IconCheck, IconCalendarPlus } from '@tabler/icons-react';
import apiClient, { handleApiError } from '@/services/api';

export default function LoansPage() {
  const [items, setItems] = useState<any[]>([]);
  const [docs, setDocs] = useState<any[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  const [statusFilter, setStatusFilter] = useState<string | null>(null);
  const [opened, { open, close }] = useDisclosure(false);
  const [form, setForm] = useState({ document_id: '', user_id: '', due_date: '', notes: '' });
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  const fetch = useCallback(async () => {
    try {
      const params = statusFilter ? `?status=${statusFilter}` : '';
      const r = await apiClient.get(`/api/v1/loans${params}`);
      setItems(r.data.data || []);
    } catch { }
  }, [statusFilter]);

  useEffect(() => { fetch(); apiClient.get('/api/v1/documents?limit=100').then(r=>setDocs(r.data.data||[])).catch(()=>{}); apiClient.get('/api/v1/users?limit=100').then(r=>setUsers(r.data.data||[])).catch(()=>{}); }, [fetch]);

  async function save() {
    setError(''); setSaving(true);
    try { await apiClient.post('/api/v1/loans', form); close(); fetch(); } catch (err) { setError(handleApiError(err)); } finally { setSaving(false); }
  }

  async function returnDoc(id: string) {
    try { await apiClient.put(`/api/v1/loans/${id}`, { action: 'return', return_condition: 'good' }); fetch(); } catch { }
  }

  async function extend(id: string) {
    const days = prompt('Prelungește cu (zile):', '7');
    if (!days) return;
    const newDate = new Date(); newDate.setDate(newDate.getDate() + parseInt(days));
    try { await apiClient.put(`/api/v1/loans/${id}`, { action: 'extend', due_date: newDate.toISOString().split('T')[0] }); fetch(); } catch { }
  }

  const statusColor: Record<string,string> = { active: 'blue', returned: 'green', overdue: 'red' };

  return (
    <div className="page-container">
      <Group justify="space-between" mb="md">
        <Title order={3}>Împrumuturi</Title>
        <Button leftSection={<IconPlus size={16} />} onClick={open}>Împrumut nou</Button>
      </Group>
      <Group mb="md">
        <Select placeholder="Status" data={[{value:'active',label:'Active'},{value:'returned',label:'Returnate'},{value:'overdue',label:'Întârziate'}]} clearable value={statusFilter} onChange={setStatusFilter} />
      </Group>
      <Table>
        <Table.Thead><Table.Tr><Table.Th>Document</Table.Th><Table.Th>Utilizator</Table.Th><Table.Th>Status</Table.Th><Table.Th>Data împrumut</Table.Th><Table.Th>Termen</Table.Th><Table.Th>Acțiuni</Table.Th></Table.Tr></Table.Thead>
        <Table.Tbody>{items.map(it=>(
          <Table.Tr key={it.id}>
            <Table.Td fw={500}>{it.document_title || it.document_code || '-'}</Table.Td>
            <Table.Td>{it.user_name || '-'}</Table.Td>
            <Table.Td><Badge color={statusColor[it.status]||'gray'}>{it.status}</Badge></Table.Td>
            <Table.Td>{it.loan_date ? new Date(it.loan_date).toLocaleDateString('ro') : '-'}</Table.Td>
            <Table.Td>{it.due_date ? new Date(it.due_date).toLocaleDateString('ro') : '-'}</Table.Td>
            <Table.Td><Group gap={4}>
              {it.status==='active' && <><ActionIcon variant="subtle" color="green" onClick={()=>returnDoc(it.id)}><IconCheck size={16}/></ActionIcon><ActionIcon variant="subtle" color="blue" onClick={()=>extend(it.id)}><IconCalendarPlus size={16}/></ActionIcon></>}
            </Group></Table.Td>
          </Table.Tr>
        ))}</Table.Tbody>
      </Table>

      <Modal opened={opened} onClose={close} title="Împrumut nou" size="lg">
        {error && <Alert color="red" mb="md">{error}</Alert>}
        <Stack>
          <Select label="Document" data={docs.map((d:any)=>({value:d.id,label:`${d.code||d.title} - ${d.title}`}))} searchable value={form.document_id} onChange={v=>setForm({...form,document_id:v||''})} required />
          <Select label="Utilizator" data={users.map((u:any)=>({value:u.id,label:`${u.first_name} ${u.last_name} (${u.email})`}))} searchable value={form.user_id} onChange={v=>setForm({...form,user_id:v||''})} required />
          <TextInput label="Termen restituire" type="date" value={form.due_date} onChange={e=>setForm({...form,due_date:e.target.value})} required />
          <TextInput label="Observații" value={form.notes} onChange={e=>setForm({...form,notes:e.target.value})} />
          <Group justify="flex-end"><Button variant="outline" onClick={close}>Anulează</Button><Button onClick={save} loading={saving}>Salvează</Button></Group>
        </Stack>
      </Modal>
    </div>
  );
}
'use client';
import { useState, useEffect } from 'react';
import { Title, Table, Button, Group, TextInput, Badge, ActionIcon, Modal, Stack, Alert, Select, Textarea } from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import { IconPlus, IconDownload, IconSearch } from '@tabler/icons-react';
import apiClient, { handleApiError } from '@/services/api';
const TYPES = [{value:'documents',label:'Documente'},{value:'requests',label:'Solicitări'},{value:'users',label:'Utilizatori'},{value:'loans',label:'Împrumuturi'}];

export default function ReportsPage() {
  const [items, setItems] = useState<any[]>([]);
  const [search, setSearch] = useState('');
  const [opened, { open, close }] = useDisclosure(false);
  const [form, setForm] = useState({ name: '', type: 'documents', config: '{}' });
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  async function fetch() { try { const r = await apiClient.get('/api/v1/reports'); setItems(r.data.data || []); } catch { } }
  useEffect(() => { fetch(); }, []);

  async function save() { setError(''); setSaving(true); try { await apiClient.post('/api/v1/reports', form); close(); fetch(); } catch (err) { setError(handleApiError(err)); } finally { setSaving(false); } }

  async function exportReport(id: string) {
    try {
      const r = await apiClient.post('/api/v1/excel/generate', { sheetName: 'Raport', headers: ['Nume','Tip','Data'], rows: [[items.find(i=>i.id===id)?.name,'-',new Date().toLocaleDateString()]] });
      const blob = new Blob([r.data], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
      const url = URL.createObjectURL(blob); const a = document.createElement('a'); a.href = url; a.download = 'raport.xlsx'; a.click();
    } catch { }
  }

  const filtered = search ? items.filter(i => i.name.toLowerCase().includes(search.toLowerCase())) : items;

  return (
    <div className="page-container">
      <Group justify="space-between" mb="md"><Title order={3}>Rapoarte</Title><Button leftSection={<IconPlus size={16} />} onClick={open}>Raport nou</Button></Group>
      <TextInput placeholder="Caută..." leftSection={<IconSearch size={14} />} value={search} onChange={e=>setSearch(e.target.value)} mb="md" />
      <Table>
        <Table.Thead><Table.Tr><Table.Th>Nume</Table.Th><Table.Th>Tip</Table.Th><Table.Th>Data</Table.Th><Table.Th>Acțiuni</Table.Th></Table.Tr></Table.Thead>
        <Table.Tbody>{filtered.map(it=>(
          <Table.Tr key={it.id}><Table.Td fw={500}>{it.name}</Table.Td><Table.Td><Badge>{TYPES.find(t=>t.value===it.type)?.label||it.type}</Badge></Table.Td><Table.Td>{it.created_at ? new Date(it.created_at).toLocaleDateString('ro') : '-'}</Table.Td><Table.Td><ActionIcon variant="subtle" color="blue" onClick={()=>exportReport(it.id)}><IconDownload size={16}/></ActionIcon></Table.Td></Table.Tr>
        ))}</Table.Tbody>
      </Table>
      <Modal opened={opened} onClose={close} title="Raport nou">
        {error&&<Alert color="red" mb="md">{error}</Alert>}
        <Stack>
          <TextInput label="Nume" value={form.name} onChange={e=>setForm({...form,name:e.target.value})} required />
          <Select label="Tip" data={TYPES} value={form.type} onChange={v=>setForm({...form,type:v||'documents'})} />
          <Group justify="flex-end"><Button variant="outline" onClick={close}>Anulează</Button><Button onClick={save} loading={saving}>Creează</Button></Group>
        </Stack>
      </Modal>
    </div>
  );
}
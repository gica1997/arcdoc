'use client';
import { useState, useEffect, useCallback } from 'react';
import { Container, Title, Table, Button, Group, Badge, Modal, Stack, Select, Textarea, Alert, Paper } from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import { IconPlus } from '@tabler/icons-react';
import { useAuth } from '@/hooks/useAuth';
import apiClient, { handleApiError } from '@/services/api';

export default function PortalRequestsPage() {
  const { user } = useAuth();
  const [items, setItems] = useState<any[]>([]);
  const [nomenclatures, setNomenclatures] = useState<any[]>([]);
  const [opened, { open, close }] = useDisclosure(false);
  const [form, setForm] = useState({ request_type: '', motivation: '', priority: 'normal', notes: '' });
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  const fetch = useCallback(async () => {
    try { const r = await apiClient.get(`/api/v1/requests?user_id=${user?.id}`); setItems(r.data.data || []); } catch { }
  }, [user]);

  useEffect(() => { fetch(); apiClient.get('/api/v1/nomenclatures?category=request_type').then(r=>setNomenclatures(r.data.data||[])).catch(()=>{}); }, [fetch]);

  async function save() {
    setError(''); setSaving(true);
    try { await apiClient.post('/api/v1/requests', form); close(); fetch(); } catch (err) { setError(handleApiError(err)); } finally { setSaving(false); }
  }

  const statusColor: Record<string,string> = { draft:'gray', submitted:'blue', approved:'green', rejected:'red', completed:'teal' };

  return (
    <Container size="lg" my="xl">
      <Group justify="space-between" mb="md"><Title order={3}>Cererile mele</Title><Button leftSection={<IconPlus size={16}/>} onClick={open}>Cerere nouă</Button></Group>
      <Table>
        <Table.Thead><Table.Tr><Table.Th>Nr.</Table.Th><Table.Th>Tip</Table.Th><Table.Th>Status</Table.Th><Table.Th>Prioritate</Table.Th><Table.Th>Data</Table.Th></Table.Tr></Table.Thead>
        <Table.Tbody>{items.map(it=>(
          <Table.Tr key={it.id}><Table.Td><Badge variant="light">{it.number}</Badge></Table.Td><Table.Td>{it.request_type}</Table.Td><Table.Td><Badge color={statusColor[it.status]||'gray'}>{it.status}</Badge></Table.Td><Table.Td><Badge color={it.priority==='urgent'?'red':'blue'}>{it.priority}</Badge></Table.Td><Table.Td>{it.created_at ? new Date(it.created_at).toLocaleDateString('ro') : '-'}</Table.Td></Table.Tr>
        ))}</Table.Tbody>
      </Table>
      <Modal opened={opened} onClose={close} title="Cerere nouă">
        {error && <Alert color="red" mb="md">{error}</Alert>}
        <Stack>
          <Select label="Tip cerere" data={nomenclatures.map((n:any)=>({value:n.code,label:n.name}))} value={form.request_type} onChange={v=>setForm({...form,request_type:v||''})} required />
          <Textarea label="Motiv" value={form.motivation} onChange={e=>setForm({...form,motivation:e.target.value})} />
          <Select label="Prioritate" data={[{value:'low',label:'Scăzută'},{value:'normal',label:'Normală'},{value:'high',label:'Ridicată'},{value:'urgent',label:'Urgentă'}]} value={form.priority} onChange={v=>setForm({...form,priority:v||'normal'})} />
          <Textarea label="Observații" value={form.notes} onChange={e=>setForm({...form,notes:e.target.value})} />
          <Group justify="flex-end"><Button variant="outline" onClick={close}>Anulează</Button><Button onClick={save} loading={saving}>Trimite</Button></Group>
        </Stack>
      </Modal>
    </Container>
  );
}
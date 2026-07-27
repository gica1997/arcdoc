'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  Title, Table, Button, Group, TextInput, Select, Badge, Modal, Stack, Alert, Progress,
} from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import { IconPlus } from '@tabler/icons-react';
import apiClient, { handleApiError } from '@/services/api';

export default function InventoryPage() {
  const [items, setItems] = useState<any[]>([]);
  const [locations, setLocations] = useState<any[]>([]);
  const [funds, setFunds] = useState<any[]>([]);
  const [opened, { open, close }] = useDisclosure(false);
  const [form, setForm] = useState({ name: '', location_id: '', fund_id: '', notes: '' });
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);
  const [statusFilter, setStatusFilter] = useState<string | null>(null);

  const fetch = useCallback(async () => {
    try {
      const params = statusFilter ? `?status=${statusFilter}` : '';
      const r = await apiClient.get(`/api/v1/inventory${params}`);
      setItems(r.data.data || []);
    } catch { }
  }, [statusFilter]);

  useEffect(() => { fetch(); apiClient.get('/api/v1/archive-locations').then(r=>setLocations(r.data.data||[])).catch(()=>{}); apiClient.get('/api/v1/archive-funds').then(r=>setFunds(r.data.data||[])).catch(()=>{}); }, [fetch]);

  async function save() {
    setError(''); setSaving(true);
    try { await apiClient.post('/api/v1/inventory', form); close(); fetch(); } catch (err) { setError(handleApiError(err)); } finally { setSaving(false); }
  }

  return (
    <div className="page-container">
      <Group justify="space-between" mb="md">
        <Title order={3}>Inventariere</Title>
        <Button leftSection={<IconPlus size={16} />} onClick={open}>Sesiune nouă</Button>
      </Group>
      <Group mb="md">
        <Select placeholder="Status" data={[{value:'draft',label:'Ciornă'},{value:'in_progress',label:'În lucru'},{value:'completed',label:'Finalizat'}]} clearable value={statusFilter} onChange={setStatusFilter} />
      </Group>
      <Table>
        <Table.Thead><Table.Tr><Table.Th>Denumire</Table.Th><Table.Th>Status</Table.Th><Table.Th>Progres</Table.Th><Table.Th>Creat de</Table.Th><Table.Th>Data</Table.Th></Table.Tr></Table.Thead>
        <Table.Tbody>{items.map(it=>{
          const pct = it.item_count > 0 ? Math.round((it.verified_count||0)/it.item_count*100) : 0;
          return (
            <Table.Tr key={it.id}>
              <Table.Td fw={500}>{it.name}</Table.Td>
              <Table.Td><Badge color={it.status==='completed'?'green':it.status==='in_progress'?'blue':'gray'}>{it.status}</Badge></Table.Td>
              <Table.Td><Progress value={pct} size="sm" color={pct===100?'green':'blue'} /><Badge size="xs" mt={4}>{it.verified_count||0}/{it.item_count||0}</Badge></Table.Td>
              <Table.Td>{it.created_by_name||'-'}</Table.Td>
              <Table.Td>{it.created_at ? new Date(it.created_at).toLocaleDateString('ro') : '-'}</Table.Td>
            </Table.Tr>
          );
        })}</Table.Tbody>
      </Table>
      <Modal opened={opened} onClose={close} title="Sesiune inventariere nouă">
        {error && <Alert color="red" mb="md">{error}</Alert>}
        <Stack>
          <TextInput label="Denumire" value={form.name} onChange={e=>setForm({...form,name:e.target.value})} required />
          <Select label="Locație" data={locations.map((l:any)=>({value:l.id,label:l.name}))} clearable searchable value={form.location_id} onChange={v=>setForm({...form,location_id:v||''})} />
          <Select label="Fond" data={funds.map((f:any)=>({value:f.id,label:f.name}))} clearable searchable value={form.fund_id} onChange={v=>setForm({...form,fund_id:v||''})} />
          <TextInput label="Observații" value={form.notes} onChange={e=>setForm({...form,notes:e.target.value})} />
          <Group justify="flex-end"><Button variant="outline" onClick={close}>Anulează</Button><Button onClick={save} loading={saving}>Creează</Button></Group>
        </Stack>
      </Modal>
    </div>
  );
}
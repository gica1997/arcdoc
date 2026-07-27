'use client';
import { useState, useEffect, useCallback } from 'react';
import { Title, Table, Button, Group, TextInput, Select, Badge, ActionIcon, Modal, Stack, Alert } from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import { IconPlus, IconCheck, IconX, IconSearch } from '@tabler/icons-react';
import { Pagination } from '@mantine/core';
import apiClient, { handleApiError } from '@/services/api';

const statusLabels: Record<string,string> = { pending:'În așteptare', approved:'Aprobată', rejected:'Respinsă', in_progress:'În lucru', picked_up:'Ridicată', completed:'Finalizată' };
const statusColors: Record<string,string> = { pending:'yellow', approved:'green', rejected:'red', in_progress:'blue', picked_up:'orange', completed:'gray' };
const urgencies = [{value:'low',label:'Scăzută'},{value:'normal',label:'Normală'},{value:'high',label:'Ridicată'},{value:'urgent',label:'Urgentă'}];

export default function WithdrawalOrdersPage() {
  const [items, setItems] = useState<any[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState<string|null>(null);
  const [opened, { open, close }] = useDisclosure(false);
  const [form, setForm] = useState({ division:'', department:'', geographic_zone:'', delivery_address:'', transport_method:'', archival_unit_number:'', urgency:'normal', notes:'' });
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  const fetch = useCallback(async () => {
    try {
      const params = new URLSearchParams(); params.set('page',String(page)); params.set('limit','20');
      if (search) params.set('search',search); if (filterStatus) params.set('status',filterStatus);
      const r = await apiClient.get(`/api/v1/withdrawal-orders?${params}`);
      setItems(r.data.data || []); setTotal(r.data.meta?.total || 0);
    } catch {}
  }, [page, search, filterStatus]);

  useEffect(() => { fetch(); }, [fetch]);

  async function save() { setError(''); setSaving(true); try { await apiClient.post('/api/v1/withdrawal-orders', form); close(); fetch(); } catch (err) { setError(handleApiError(err)); } finally { setSaving(false); } }
  async function approve(id: string) { try { await apiClient.put(`/api/v1/withdrawal-orders/${id}`, { status: 'approved' }); fetch(); } catch {} }
  async function reject(id: string) { try { await apiClient.put(`/api/v1/withdrawal-orders/${id}`, { status: 'rejected' }); fetch(); } catch {} }

  return (
    <div className="page-container">
      <Group justify="space-between" mb="md"><Title order={3}>Cereri Retragere</Title><Button leftSection={<IconPlus size={16} />} onClick={open}>Cerere nouă</Button></Group>
      <Group mb="md">
        <TextInput placeholder="Caută..." leftSection={<IconSearch size={14} />} value={search} onChange={e=>{setSearch(e.target.value);setPage(1);}} style={{flex:1}} />
        <Select placeholder="Status" data={Object.entries(statusLabels).map(([k,v])=>({value:k,label:v}))} clearable value={filterStatus} onChange={v=>{setFilterStatus(v);setPage(1);}} />
      </Group>
      <Table><Table.Thead><Table.Tr><Table.Th>Divizie</Table.Th><Table.Th>Departament</Table.Th><Table.Th>Nr. unitate</Table.Th><Table.Th>Urgență</Table.Th><Table.Th>Status</Table.Th><Table.Th>Acțiuni</Table.Th></Table.Tr></Table.Thead>
      <Table.Tbody>{items.map(it=>(
        <Table.Tr key={it.id}><Table.Td fw={500}>{it.division}</Table.Td><Table.Td>{it.department}</Table.Td><Table.Td><Badge variant="light">{it.archival_unit_number}</Badge></Table.Td><Table.Td><Badge color={it.urgency==='urgent'?'red':'blue'}>{urgencies.find(u=>u.value===it.urgency)?.label||it.urgency}</Badge></Table.Td><Table.Td><Badge color={statusColors[it.status]||'gray'}>{statusLabels[it.status]||it.status}</Badge></Table.Td>
          <Table.Td><Group gap={4}>{it.status==='pending' && <><ActionIcon variant="subtle" color="green" onClick={()=>approve(it.id)}><IconCheck size={16}/></ActionIcon><ActionIcon variant="subtle" color="red" onClick={()=>reject(it.id)}><IconX size={16}/></ActionIcon></>}</Group></Table.Td>
        </Table.Tr>
      ))}</Table.Tbody></Table>
      {total>20 && <Pagination total={Math.ceil(total/20)} value={page} onChange={setPage} mt="md" />}

      <Modal opened={opened} onClose={close} title="Cerere retragere nouă" size="lg">
        {error&&<Alert color="red" mb="md">{error}</Alert>}
        <Stack>
          <TextInput label="Divizie" value={form.division} onChange={e=>setForm({...form,division:e.target.value})} required />
          <TextInput label="Departament" value={form.department} onChange={e=>setForm({...form,department:e.target.value})} required />
          <TextInput label="Zonă geografică" value={form.geographic_zone} onChange={e=>setForm({...form,geographic_zone:e.target.value})} />
          <TextInput label="Adresă livrare" value={form.delivery_address} onChange={e=>setForm({...form,delivery_address:e.target.value})} />
          <TextInput label="Transport" value={form.transport_method} onChange={e=>setForm({...form,transport_method:e.target.value})} />
          <TextInput label="Nr. unitate arhivistică" value={form.archival_unit_number} onChange={e=>setForm({...form,archival_unit_number:e.target.value})} required />
          <Select label="Urgență" data={urgencies} value={form.urgency} onChange={v=>setForm({...form,urgency:v||'normal'})} />
          <TextInput label="Observații" value={form.notes} onChange={e=>setForm({...form,notes:e.target.value})} />
          <Group justify="flex-end"><Button variant="outline" onClick={close}>Anulează</Button><Button onClick={save} loading={saving}>Creează</Button></Group>
        </Stack>
      </Modal>
    </div>
  );
}
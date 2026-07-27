'use client';
import { useState, useEffect, useCallback } from 'react';
import { Title, Table, Button, Group, TextInput, Select, Badge, ActionIcon, Modal, Stack, Alert, Paper } from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import { IconPlus, IconCheck, IconX, IconSearch } from '@tabler/icons-react';
import { Pagination } from '@mantine/core';
import apiClient, { handleApiError } from '@/services/api';

const STATUSES = ['pending','approved','rejected','in_progress','delivered','in_deposit','completed'];
const statusLabels: Record<string,string> = { pending:'În așteptare', approved:'Aprobată', rejected:'Respinsă', in_progress:'În lucru', delivered:'Predată', in_deposit:'În depozit', completed:'Finalizată' };
const statusColors: Record<string,string> = { pending:'yellow', approved:'green', rejected:'red', in_progress:'blue', delivered:'teal', in_deposit:'violet', completed:'gray' };

export default function TransferOrdersPage() {
  const [items, setItems] = useState<any[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState<string|null>(null);
  const [opened, { open, close }] = useDisclosure(false);
  const [form, setForm] = useState({ division:'', department:'', geographic_zone:'', address:'', transport_method:'', organization_type:'', quantity:'', notes:'' });
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  const fetch = useCallback(async () => {
    try {
      const params = new URLSearchParams(); params.set('page',String(page)); params.set('limit','20');
      if (search) params.set('search',search);
      if (filterStatus) params.set('status',filterStatus);
      const r = await apiClient.get(`/api/v1/transfer-orders?${params}`);
      setItems(r.data.data || []); setTotal(r.data.meta?.total || 0);
    } catch {}
  }, [page, search, filterStatus]);

  useEffect(() => { fetch(); }, [fetch]);

  async function save() { setError(''); setSaving(true); try { await apiClient.post('/api/v1/transfer-orders', form); close(); fetch(); } catch (err) { setError(handleApiError(err)); } finally { setSaving(false); } }
  async function approve(id: string) { try { await apiClient.put(`/api/v1/transfer-orders/${id}`, { status: 'approved' }); fetch(); } catch {} }
  async function reject(id: string) { try { await apiClient.put(`/api/v1/transfer-orders/${id}`, { status: 'rejected' }); fetch(); } catch {} }

  const fields = ['division','department','geographic_zone','address','transport_method','organization_type','quantity','notes'];
  const labels = ['Divizie','Departament','Zonă geografică','Adresă','Transport','Organizare','Cantitate','Observații'];

  return (
    <div className="page-container">
      <Group justify="space-between" mb="md"><Title order={3}>Comenzi Transfer</Title><Button leftSection={<IconPlus size={16} />} onClick={open}>Comandă nouă</Button></Group>
      <Group mb="md">
        <TextInput placeholder="Caută..." leftSection={<IconSearch size={14} />} value={search} onChange={e=>{setSearch(e.target.value);setPage(1);}} style={{flex:1}} />
        <Select placeholder="Status" data={STATUSES.map(s=>({value:s,label:statusLabels[s]}))} clearable value={filterStatus} onChange={v=>{setFilterStatus(v);setPage(1);}} />
      </Group>
      <Table><Table.Thead><Table.Tr><Table.Th>Divizie</Table.Th><Table.Th>Departament</Table.Th><Table.Th>Status</Table.Th><Table.Th>Cantitate</Table.Th><Table.Th>Creat de</Table.Th><Table.Th>Acțiuni</Table.Th></Table.Tr></Table.Thead>
      <Table.Tbody>{items.map(it=>(
        <Table.Tr key={it.id}><Table.Td fw={500}>{it.division}</Table.Td><Table.Td>{it.department}</Table.Td><Table.Td><Badge color={statusColors[it.status]||'gray'}>{statusLabels[it.status]||it.status}</Badge></Table.Td><Table.Td>{it.quantity||0}</Table.Td><Table.Td>{it.created_by_name||'-'}</Table.Td>
          <Table.Td><Group gap={4}>{it.status==='pending' && <><ActionIcon variant="subtle" color="green" onClick={()=>approve(it.id)}><IconCheck size={16}/></ActionIcon><ActionIcon variant="subtle" color="red" onClick={()=>reject(it.id)}><IconX size={16}/></ActionIcon></>}</Group></Table.Td>
        </Table.Tr>
      ))}</Table.Tbody></Table>
      {total>20 && <Pagination total={Math.ceil(total/20)} value={page} onChange={setPage} mt="md" />}

      <Modal opened={opened} onClose={close} title="Comandă transfer nouă" size="lg">
        {error&&<Alert color="red" mb="md">{error}</Alert>}
        <Stack>
          {fields.map((f,i)=><TextInput key={f} label={labels[i]} value={(form as any)[f]} onChange={e=>setForm({...form,[f]:e.target.value})} required={i<2} />)}
          <Group justify="flex-end"><Button variant="outline" onClick={close}>Anulează</Button><Button onClick={save} loading={saving}>Creează</Button></Group>
        </Stack>
      </Modal>
    </div>
  );
}
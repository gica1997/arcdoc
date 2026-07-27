'use client';
import { useState, useEffect, useCallback } from 'react';
import { Title, Table, Group, TextInput, Select, Badge, Pagination } from '@mantine/core';
import { IconSearch } from '@tabler/icons-react';
import apiClient from '@/services/api';

const OPERATIONS = ['transfer_created','transfer_status_changed','withdrawal_requested','withdrawal_status_changed','loan_created','loan_returned','inventory_created','disposal_proposed','disposal_approved'];

export default function RegistryPage() {
  const [items, setItems] = useState<any[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [operationFilter, setOperationFilter] = useState<string|null>(null);

  const fetch = useCallback(async () => {
    try {
      const params = new URLSearchParams(); params.set('page',String(page)); params.set('limit','20');
      if (search) params.set('search',search);
      if (operationFilter) params.set('operation',operationFilter);
      const r = await apiClient.get(`/api/v1/evidence-registry?${params}`);
      setItems(r.data.data || []); setTotal(r.data.meta?.total || 0);
    } catch {}
  }, [page, search, operationFilter]);
  useEffect(() => { fetch(); }, [fetch]);

  return (
    <div className="page-container">
      <Title order={3} mb="lg">Registru de Evidență</Title>
      <Group mb="md">
        <TextInput placeholder="Caută..." leftSection={<IconSearch size={14}/>} value={search}
          onChange={e=>{setSearch(e.target.value);setPage(1);}} style={{flex:1}} />
        <Select placeholder="Operațiune" data={OPERATIONS.map(o=>({value:o,label:o.replace(/_/g,' ')}))}
          clearable value={operationFilter} onChange={v=>{setOperationFilter(v);setPage(1);}} />
      </Group>
      <Table>
        <Table.Thead><Table.Tr>
          <Table.Th>Data</Table.Th><Table.Th>Utilizator</Table.Th><Table.Th>Operațiune</Table.Th>
          <Table.Th>Divizie</Table.Th><Table.Th>Departament</Table.Th><Table.Th>Status nou</Table.Th><Table.Th>Observații</Table.Th>
        </Table.Tr></Table.Thead>
        <Table.Tbody>
          {items.map((it:any)=>(
            <Table.Tr key={it.id}>
              <Table.Td>{it.created_at ? new Date(it.created_at).toLocaleString('ro') : '-'}</Table.Td>
              <Table.Td>{it.user_name || '-'}</Table.Td>
              <Table.Td><Badge size="sm" variant="light">{it.operation?.replace(/_/g,' ')}</Badge></Table.Td>
              <Table.Td>{it.division || '-'}</Table.Td>
              <Table.Td>{it.department || '-'}</Table.Td>
              <Table.Td><Badge size="sm" color="blue">{it.new_status || '-'}</Badge></Table.Td>
              <Table.Td>{it.notes || '-'}</Table.Td>
            </Table.Tr>
          ))}
        </Table.Tbody>
      </Table>
      {total>20 && <Pagination total={Math.ceil(total/20)} value={page} onChange={setPage} mt="md"/>}
    </div>
  );
}
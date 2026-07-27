'use client';
import { useState, useEffect, useCallback } from 'react';
import { Title, Table, Group, Select, Badge, TextInput, Pagination } from '@mantine/core';
import { IconSearch } from '@tabler/icons-react';
import apiClient from '@/services/api';

export default function AuditPage() {
  const [items, setItems] = useState<any[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [actionFilter, setActionFilter] = useState<string | null>(null);

  const fetch = useCallback(async () => {
    try {
      const params = new URLSearchParams();
      params.set('page', String(page)); params.set('limit', '20');
      if (search) params.set('search', search);
      if (actionFilter) params.set('action', actionFilter);
      const r = await apiClient.get(`/api/v1/admin/audit?${params}`);
      setItems(r.data?.data || []);
      setTotal(r.data?.meta?.total || 0);
    } catch { }
  }, [page, search, actionFilter]);

  useEffect(() => { fetch(); }, [fetch]);

  return (
    <div className="page-container">
      <Title order={3} mb="lg">Audit</Title>
      <Group mb="md">
        <TextInput placeholder="Caută..." leftSection={<IconSearch size={14} />} value={search} onChange={e => { setSearch(e.target.value); setPage(1); }} style={{ flex: 1 }} />
        <Select placeholder="Acțiune" data={[
          { value: 'login', label: 'Autentificare' }, { value: 'logout', label: 'Deconectare' },
          { value: 'create', label: 'Creare' }, { value: 'update', label: 'Modificare' },
          { value: 'delete', label: 'Ștergere' }, { value: 'approve', label: 'Aprobare' },
        ]} clearable value={actionFilter} onChange={v => { setActionFilter(v); setPage(1); }} />
      </Group>
      <Table>
        <Table.Thead><Table.Tr><Table.Th>Acțiune</Table.Th><Table.Th>Entitate</Table.Th><Table.Th>Utilizator</Table.Th><Table.Th>Data</Table.Th><Table.Th>IP</Table.Th></Table.Tr></Table.Thead>
        <Table.Tbody>{items.map((it: any) => (
          <Table.Tr key={it.id}>
            <Table.Td><Badge color="blue">{it.action}</Badge></Table.Td>
            <Table.Td>{it.entity_type} {it.entity_id ? `#${it.entity_id.substring(0,8)}` : ''}</Table.Td>
            <Table.Td>{it.user_name || 'Sistem'}</Table.Td>
            <Table.Td>{it.created_at ? new Date(it.created_at).toLocaleString('ro') : '-'}</Table.Td>
            <Table.Td>{it.ip_address || '-'}</Table.Td>
          </Table.Tr>
        ))}</Table.Tbody>
      </Table>
      {total > 20 && <Pagination total={Math.ceil(total / 20)} value={page} onChange={setPage} mt="md" />}
    </div>
  );
}
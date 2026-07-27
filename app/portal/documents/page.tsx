// ============================================
// ArcDoc Enterprise - Portal My Documents
// ============================================

'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  Title, Table, Badge, Group, TextInput, ActionIcon, Tooltip, Paper, Text, Box, Pagination,
} from '@mantine/core';
import {
  IconSearch, IconEye, IconDownload, IconFileText, IconFileUnknown,
} from '@tabler/icons-react';
import { useAuth } from '@/hooks/useAuth';
import apiClient from '@/services/api';

export default function PortalDocumentsPage() {
  const { user } = useAuth();
  const [items, setItems] = useState<any[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(false);

  const fetch = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      params.set('page', String(page));
      params.set('limit', '20');
      if (search) params.set('search', search);
      const r = await apiClient.get(`/api/v1/portal/my-documents?${params}`);
      setItems(r.data.data || []);
      setTotal(r.data.meta?.total || 0);
    } catch {} finally { setLoading(false); }
  }, [page, search]);

  useEffect(() => { fetch(); }, [fetch]);

  const accessLevelColor: Record<string, string> = {
    public: 'green', internal: 'blue', confidential: 'orange', secret: 'red', top_secret: 'dark',
  };

  return (
    <Box p="xl">
      <Title order={3} mb="md">Documentele Mele</Title>

      <Paper withBorder p="sm" mb="md">
        <TextInput placeholder="Caută după titlu, cod sau tip..." leftSection={<IconSearch size={14} />}
          value={search} onChange={e => { setSearch(e.target.value); setPage(1); }} />
      </Paper>

      <Paper withBorder>
        <Table>
          <Table.Thead>
            <Table.Tr>
              <Table.Th>Cod</Table.Th>
              <Table.Th>Titlu</Table.Th>
              <Table.Th>Tip</Table.Th>
              <Table.Th>Acces</Table.Th>
              <Table.Th>Nr. Solicitare</Table.Th>
              <Table.Th>Pagini</Table.Th>
              <Table.Th>Status</Table.Th>
              <Table.Th>Acțiuni</Table.Th>
            </Table.Tr>
          </Table.Thead>
          <Table.Tbody>
            {items.length === 0 ? (
              <Table.Tr>
                <Table.Td colSpan={8}>
                  <Text ta="center" py="xl" c="dimmed">
                    {loading ? 'Se încarcă...' : 'Nu ai documente asociate solicitărilor tale.'}
                  </Text>
                </Table.Td>
              </Table.Tr>
            ) : (
              items.map(d => (
                <Table.Tr key={d.id}>
                  <Table.Td><Badge variant="light">{d.code}</Badge></Table.Td>
                  <Table.Td fw={500}>{d.title}</Table.Td>
                  <Table.Td>{d.document_type}</Table.Td>
                  <Table.Td>
                    <Badge color={accessLevelColor[d.access_level] || 'gray'} size="sm">
                      {d.access_level}
                    </Badge>
                  </Table.Td>
                  <Table.Td>
                    <Badge variant="outline" component="a" href={`/portal/requests/${d.request_id}`} style={{ cursor: 'pointer' }}>
                      {d.request_number}
                    </Badge>
                  </Table.Td>
                  <Table.Td>{d.pages || '-'}</Table.Td>
                  <Table.Td>
                    <Badge color={d.status === 'active' ? 'green' : 'gray'} size="sm">{d.status}</Badge>
                  </Table.Td>
                  <Table.Td>
                    <Group gap={4}>
                      <Tooltip label="Vizualizează"><ActionIcon variant="subtle" color="blue"><IconEye size={15} /></ActionIcon></Tooltip>
                      <Tooltip label="Descarcă"><ActionIcon variant="subtle" color="green"><IconDownload size={15} /></ActionIcon></Tooltip>
                    </Group>
                  </Table.Td>
                </Table.Tr>
              ))
            )}
          </Table.Tbody>
        </Table>
      </Paper>

      {total > 20 && <Pagination total={Math.ceil(total / 20)} value={page} onChange={setPage} mt="md" />}
    </Box>
  );
}

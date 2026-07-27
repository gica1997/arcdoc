'use client';

import { useState, useEffect } from 'react';
import { Title, Table, Badge, Group } from '@mantine/core';
import apiClient from '@/services/api';

interface PermItem { id: string; name: string; slug: string; module: string; description?: string; }

const MODULE_LABELS: Record<string, string> = {
  dashboard: 'Dashboard', users: 'Utilizatori', roles: 'Roluri', permissions: 'Permisiuni',
  funds: 'Fonduri', inventories: 'Inventare', units: 'Unități', documents: 'Documente',
  requests: 'Solicitări', consultations: 'Consultări', reports: 'Rapoarte',
  settings: 'Setări', audit: 'Audit', notifications: 'Notificări', organization: 'Organizare',
};

export default function PermissionsPage() {
  const [perms, setPerms] = useState<PermItem[]>([]);

  useEffect(() => {
    apiClient.get('/api/v1/users/permissions').then(r => setPerms(r.data.data || [])).catch(() => {});
  }, []);

  const grouped = perms.reduce((acc: Record<string, PermItem[]>, p) => {
    if (!acc[p.module]) acc[p.module] = [];
    acc[p.module].push(p);
    return acc;
  }, {});

  return (
    <div className="page-container">
      <Title order={3} mb="lg">Permisiuni</Title>
      {Object.entries(grouped).sort().map(([mod, items]) => (
        <Table key={mod} mb="md" highlightOnHover>
          <Table.Thead>
            <Table.Tr><Table.Th colSpan={3} bg="gray.0">{MODULE_LABELS[mod] || mod}</Table.Th></Table.Tr>
          </Table.Thead>
          <Table.Tbody>
            {items.map(p => (
              <Table.Tr key={p.id}>
                <Table.Td>{p.name}</Table.Td>
                <Table.Td><Badge variant="light">{p.slug}</Badge></Table.Td>
              </Table.Tr>
            ))}
          </Table.Tbody>
        </Table>
      ))}
    </div>
  );
}
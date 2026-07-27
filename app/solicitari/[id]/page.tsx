'use client';

import { useState, useEffect } from 'react';
import {
  Title, Paper, Group, Badge, Text, Stack, Grid, Box, Textarea, Button, Alert, Timeline, Select,
} from '@mantine/core';
import { IconCheck, IconX, IconMessage, IconUserCheck, IconSend } from '@tabler/icons-react';
import { useParams } from 'next/navigation';
import apiClient from '@/services/api';

export default function RequestDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [data, setData] = useState<any>(null);
  const [users, setUsers] = useState<any[]>([]);
  const [msg, setMsg] = useState('');
  const [assignTo, setAssignTo] = useState('');
  const [loading, setLoading] = useState(false);

  async function fetch() {
    try { const r = await apiClient.get(`/api/v1/requests/${id}`); setData(r.data.data); } catch { }
  }

  useEffect(() => {
    fetch();
    apiClient.get('/api/v1/users?limit=100').then(r => setUsers(r.data.data || [])).catch(() => {});
  }, [id]);

  async function sendMessage() {
    if (!msg.trim()) return;
    try { await apiClient.post(`/api/v1/requests/${id}/message`, { content: msg }); setMsg(''); fetch(); } catch { }
  }

  async function approve() { try { await apiClient.post(`/api/v1/requests/${id}/approve`); fetch(); } catch { } }
  async function reject() { const r = prompt('Motiv:'); if (!r) return; try { await apiClient.post(`/api/v1/requests/${id}/reject`, { reason: r }); fetch(); } catch { } }
  async function assign() { try { await apiClient.post(`/api/v1/requests/${id}/assign`, { assigned_to: assignTo }); fetch(); } catch { } }

  if (!data) return <div className="page-container"><Text>Se încarcă...</Text></div>;

  const statusColor: Record<string, string> = { draft: 'gray', submitted: 'blue', approved: 'green', rejected: 'red', completed: 'teal' };

  return (
    <div className="page-container">
      <Group justify="space-between" mb="md">
        <Box>
          <Title order={3}>Cerere {data.number}</Title>
          <Text size="sm" c="dimmed">{data.user_name} · {data.user_email}</Text>
        </Box>
        <Badge size="lg" color={statusColor[data.status] || 'gray'}>{data.status}</Badge>
      </Group>

      <Grid>
        <Grid.Col span={{ base: 12, md: 8 }}>
          <Paper withBorder p="md" mb="md">
            <Title order={5} mb="sm">Detalii cerere</Title>
            <Grid>
              <Grid.Col span={6}><Text size="sm" c="dimmed">Tip:</Text><Text>{data.request_type}</Text></Grid.Col>
              <Grid.Col span={6}><Text size="sm" c="dimmed">Prioritate:</Text><Badge color={data.priority === 'urgent' ? 'red' : 'blue'}>{data.priority}</Badge></Grid.Col>
              <Grid.Col span={12}><Text size="sm" c="dimmed">Motiv:</Text><Text>{data.motivation || '-'}</Text></Grid.Col>
              <Grid.Col span={12}><Text size="sm" c="dimmed">Observații:</Text><Text>{data.notes || '-'}</Text></Grid.Col>
            </Grid>
          </Paper>

          {data.documents?.length > 0 && (
            <Paper withBorder p="md" mb="md">
              <Title order={5} mb="sm">Documente solicitate</Title>
              {data.documents.map((d: any) => (
                <Group key={d.id}><Badge>{d.code}</Badge><Text size="sm">{d.title}</Text></Group>
              ))}
            </Paper>
          )}

          <Paper withBorder p="md" mb="md">
            <Title order={5} mb="sm">Mesaje</Title>
            {data.messages?.map((m: any) => (
              <Box key={m.id} mb="xs"><Text size="sm" fw={500}>{m.user_name}</Text><Text size="sm" c="dimmed">{m.content}</Text><Text size="xs" c="gray.5">{new Date(m.created_at).toLocaleString('ro')}</Text></Box>
            ))}
            <Group mt="md">
              <Textarea style={{ flex: 1 }} placeholder="Scrie un mesaj..." value={msg} onChange={e => setMsg(e.target.value)} />
              <Button onClick={sendMessage} leftSection={<IconSend size={14} />}>Trimite</Button>
            </Group>
          </Paper>
        </Grid.Col>

        <Grid.Col span={{ base: 12, md: 4 }}>
          <Paper withBorder p="md" mb="md">
            <Title order={5} mb="sm">Acțiuni</Title>
            <Stack>
              {data.status === 'submitted' && (
                <Group grow>
                  <Button color="green" onClick={approve} leftSection={<IconCheck size={14} />}>Aprobă</Button>
                  <Button color="red" onClick={reject} leftSection={<IconX size={14} />}>Respinge</Button>
                </Group>
              )}
              <Select placeholder="Atribuie utilizator" data={users.map((u: any) => ({ value: u.id, label: `${u.first_name} ${u.last_name}` }))}
                value={assignTo} onChange={v => setAssignTo(v || '')} searchable />
              <Button variant="outline" onClick={assign} leftSection={<IconUserCheck size={14} />}>Atribuie</Button>
              {data.assigned_name && <Text size="sm">Atribuit: <strong>{data.assigned_name}</strong></Text>}
            </Stack>
          </Paper>

          <Paper withBorder p="md">
            <Title order={5} mb="sm">Istoric</Title>
            <Timeline active={data.timeline?.length || 0} bulletSize={24} lineWidth={2}>
              {data.timeline?.map((t: any) => (
                <Timeline.Item key={t.id} title={t.action}>
                  <Text size="xs" c="dimmed">{t.description}</Text>
                  <Text size="xs">{new Date(t.created_at).toLocaleString('ro')} · {t.user_name}</Text>
                </Timeline.Item>
              ))}
            </Timeline>
          </Paper>
        </Grid.Col>
      </Grid>
    </div>
  );
}
// ============================================
// ArcDoc Enterprise - Solicitant Request Detail
// ============================================

'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  Container, Title, Text, Paper, Group, Badge, Stack, Grid, Timeline, Button,
  Alert, Box, Table, ActionIcon, Tooltip, Divider, Loader, Stepper,
} from '@mantine/core';
import {
  IconArrowLeft, IconSend, IconFileDownload, IconEye, IconClock, IconCheck,
  IconX, IconMessage, IconUser, IconCalendar, IconFileText, IconHistory,
  IconPrinter, IconDownload,
} from '@tabler/icons-react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import apiClient from '@/services/api';

const statusConfig: Record<string, { label: string; color: string; step: number }> = {
  draft: { label: 'Ciornă', color: 'gray', step: 0 },
  submitted: { label: 'Depusă', color: 'blue', step: 1 },
  approved: { label: 'Aprobată', color: 'green', step: 2 },
  in_progress: { label: 'În Lucru', color: 'orange', step: 2 },
  completed: { label: 'Finalizată', color: 'teal', step: 3 },
  rejected: { label: 'Respinsă', color: 'red', step: -1 },
  cancelled: { label: 'Anulată', color: 'gray', step: -1 },
};

interface Props {
  params: Promise<{ id: string }>;
}

export default function RequestDetailPage({ params }: Props) {
  const router = useRouter();
  const { user } = useAuth();
  const [request, setRequest] = useState<any>(null);
  const [history, setHistory] = useState<any[]>([]);
  const [documents, setDocuments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [id, setId] = useState<string | null>(null);

  useEffect(() => {
    params.then(p => setId(p.id));
  }, [params]);

  useEffect(() => {
    if (!id) return;
    async function load() {
      try {
        const [r, h, d] = await Promise.all([
          apiClient.get(`/api/v1/requests/${id}`),
          apiClient.get(`/api/v1/requests/${id}/history`).catch(() => ({ data: { data: [] } })),
          apiClient.get(`/api/v1/requests/${id}/documents`).catch(() => ({ data: { data: [] } })),
        ]);
        setRequest(r.data.data);
        setHistory(h.data.data || []);
        setDocuments(d.data.data || []);
      } catch {} finally { setLoading(false); }
    }
    load();
  }, [id]);

  if (loading) {
    return <Container size="lg" py="xl"><Loader size="lg" /></Container>;
  }

  if (!request) {
    return (
      <Container size="lg" py="xl">
        <Alert color="red">Solicitarea nu a fost găsită.</Alert>
        <Button mt="md" variant="outline" leftSection={<IconArrowLeft size={16} />} onClick={() => router.back()}>
          Înapoi
        </Button>
      </Container>
    );
  }

  const cfg = statusConfig[request.status] || { label: request.status, color: 'gray', step: 0 };
  const isOwner = user?.id === request.user_id;

  const steps = [
    { label: 'Ciornă', description: 'Solicitare creată' },
    { label: 'Depusă', description: 'Trimisă spre procesare' },
    { label: 'Aprobată', description: 'Acceptată în lucru' },
    { label: 'Finalizată', description: 'Solicitare încheiată' },
  ];

  return (
    <Box p="xl">
      <Group mb="md">
        <Button variant="subtle" leftSection={<IconArrowLeft size={16} />} onClick={() => router.push('/portal/requests')}>
          Înapoi la solicitări
        </Button>
      </Group>

      <Paper withBorder p="lg" radius="md">
        {/* Header */}
        <Group justify="space-between" mb="lg">
          <Box>
            <Group gap="xs" mb={4}>
              <Title order={3}>{request.number}</Title>
              <Badge color={cfg.color} size="lg">{cfg.label}</Badge>
              {request.priority === 'urgent' && <Badge color="red" variant="filled">Urgent</Badge>}
            </Group>
            <Text c="dimmed" size="sm">{request.request_type}</Text>
          </Box>
          <Group>
            <Button variant="outline" leftSection={<IconPrinter size={16} />} size="sm">Tipărește</Button>
            {request.status === 'draft' && isOwner && (
              <Button leftSection={<IconSend size={16} />} size="sm"
                onClick={async () => {
                  await apiClient.put(`/api/v1/requests/${id}`, { status: 'submitted' });
                  window.location.reload();
                }}>
                Trimite Solicitarea
              </Button>
            )}
          </Group>
        </Group>

        {/* Stepper */}
        {request.status !== 'rejected' && request.status !== 'cancelled' && (
          <Stepper active={cfg.step} completedIcon={<IconCheck size={14} />} mb="lg" size="sm">
            {steps.map(s => <Stepper.Step key={s.label} label={s.label} description={s.description} />)}
          </Stepper>
        )}

        <Grid>
          {/* Request Details */}
          <Grid.Col span={{ base: 12, md: 6 }}>
            <Paper withBorder p="md" radius="md">
              <Title order={5} mb="md">Detalii Solicitare</Title>
              <Stack gap="sm">
                <Group><Text size="sm" fw={500} w={140}>Tip:</Text><Text size="sm">{request.request_type}</Text></Group>
                <Group><Text size="sm" fw={500} w={140}>Prioritate:</Text>
                  <Badge color={request.priority === 'urgent' ? 'red' : request.priority === 'high' ? 'orange' : 'blue'}>
                    {request.priority}
                  </Badge>
                </Group>
                <Group><Text size="sm" fw={500} w={140}>Motiv:</Text><Text size="sm">{request.motivation || '-'}</Text></Group>
                <Group><Text size="sm" fw={500} w={140}>Observații:</Text><Text size="sm">{request.notes || '-'}</Text></Group>
                <Group><Text size="sm" fw={500} w={140}>Data creării:</Text><Text size="sm">{request.created_at ? new Date(request.created_at).toLocaleString('ro') : '-'}</Text></Group>
                <Group><Text size="sm" fw={500} w={140}>Termen:</Text><Text size="sm">{request.deadline ? new Date(request.deadline).toLocaleDateString('ro') : '-'}</Text></Group>
              </Stack>
            </Paper>
          </Grid.Col>

          {/* Assignment Info */}
          <Grid.Col span={{ base: 12, md: 6 }}>
            <Paper withBorder p="md" radius="md">
              <Title order={5} mb="md">Informații Procesare</Title>
              <Stack gap="sm">
                <Group><Text size="sm" fw={500} w={140}>Responsabil:</Text>
                  <Group gap={4}>
                    <IconUser size={14} />
                    <Text size="sm">{request.assigned_name || 'Neasignat'}</Text>
                  </Group>
                </Group>
                <Group><Text size="sm" fw={500} w={140}>Status:</Text><Badge color={cfg.color}>{cfg.label}</Badge></Group>
                <Group><Text size="sm" fw={500} w={140}>Ultima actualizare:</Text>
                  <Text size="sm">{request.updated_at ? new Date(request.updated_at).toLocaleString('ro') : '-'}</Text>
                </Group>
                {request.resolution_notes && (
                  <>
                    <Divider />
                    <Group><Text size="sm" fw={500} w={140}>Rezoluție:</Text><Text size="sm">{request.resolution_notes}</Text></Group>
                  </>
                )}
              </Stack>
            </Paper>
          </Grid.Col>

          {/* Documents */}
          <Grid.Col span={12}>
            <Paper withBorder p="md" radius="md">
              <Group justify="space-between" mb="md">
                <Title order={5}>Documente Asociate</Title>
                {request.status === 'submitted' || request.status === 'approved' ? (
                  <Button size="sm" variant="outline" leftSection={<IconFileText size={14} />}>
                    Adaugă Document
                  </Button>
                ) : null}
              </Group>
              {documents.length === 0 ? (
                <Text c="dimmed" size="sm" py="md">Niciun document asociat.</Text>
              ) : (
                <Table>
                  <Table.Thead>
                    <Table.Tr>
                      <Table.Th>Cod</Table.Th>
                      <Table.Th>Titlu</Table.Th>
                      <Table.Th>Tip</Table.Th>
                      <Table.Th>Format</Table.Th>
                      <Table.Th>Pagini</Table.Th>
                      <Table.Th>Acțiuni</Table.Th>
                    </Table.Tr>
                  </Table.Thead>
                  <Table.Tbody>
                    {documents.map((d: any) => (
                      <Table.Tr key={d.id}>
                        <Table.Td><Badge variant="light">{d.code}</Badge></Table.Td>
                        <Table.Td fw={500}>{d.title}</Table.Td>
                        <Table.Td>{d.document_type}</Table.Td>
                        <Table.Td>{d.format || '-'}</Table.Td>
                        <Table.Td>{d.pages || '-'}</Table.Td>
                        <Table.Td>
                          <Group gap={4}>
                            <Tooltip label="Vizualizează"><ActionIcon variant="subtle" color="blue"><IconEye size={15} /></ActionIcon></Tooltip>
                            <Tooltip label="Descarcă"><ActionIcon variant="subtle" color="green"><IconDownload size={15} /></ActionIcon></Tooltip>
                          </Group>
                        </Table.Td>
                      </Table.Tr>
                    ))}
                  </Table.Tbody>
                </Table>
              )}
            </Paper>
          </Grid.Col>

          {/* History Timeline */}
          <Grid.Col span={12}>
            <Paper withBorder p="md" radius="md">
              <Title order={5} mb="md">
                <Group gap={4}>
                  <IconHistory size={16} />
                  Istoric Solicitare
                </Group>
              </Title>
              {history.length === 0 ? (
                <Text c="dimmed" size="sm" py="md">Niciun eveniment înregistrat.</Text>
              ) : (
                <Timeline active={history.length} bulletSize={24} lineWidth={2}>
                  {history.map((h: any, i: number) => (
                    <Timeline.Item key={h.id || i}
                      title={
                        <Group gap={4}>
                          <Text fw={500}>{h.event_type || h.action}</Text>
                          {h.user_name && <Text size="sm" c="dimmed">- {h.user_name}</Text>}
                        </Group>
                      }
                      bullet={
                        h.event_type?.includes('created') || h.action?.includes('created') ? <IconSend size={12} /> :
                        h.event_type?.includes('completed') || h.action?.includes('completed') ? <IconCheck size={12} /> :
                        h.event_type?.includes('rejected') || h.action?.includes('rejected') ? <IconX size={12} /> :
                        <IconClock size={12} />
                      }
                    >
                      <Text size="xs" c="dimmed">{h.description || h.notes || ''}</Text>
                      <Text size="xs" c="gray.5">{h.created_at ? new Date(h.created_at).toLocaleString('ro') : ''}</Text>
                    </Timeline.Item>
                  ))}
                </Timeline>
              )}
            </Paper>
          </Grid.Col>
        </Grid>
      </Paper>
    </Box>
  );
}

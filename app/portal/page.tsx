'use client';

import { useState, useEffect } from 'react';
import {
  Title, Paper, TextInput, Button, Alert, Stack, Group, Badge, Text, Box,
  SimpleGrid, Card, Select, Textarea,
} from '@mantine/core';
import { IconArchive, IconSearch, IconFileText, IconSend, IconCheck, IconAlertCircle } from '@tabler/icons-react';
import apiClient from '@/services/api';
import { motion } from 'framer-motion';

export default function PortalPage() {
  const [trackingCode, setTrackingCode] = useState('');
  const [trackingResult, setTrackingResult] = useState<any>(null);
  const [trackingError, setTrackingError] = useState('');
  const [searchLoading, setSearchLoading] = useState(false);

  const [showRequest, setShowRequest] = useState(false);
  const [requestForm, setRequestForm] = useState({ name: '', email: '', phone: '', requestType: '', details: '' });
  const [requestSent, setRequestSent] = useState(false);
  const [requestError, setRequestError] = useState('');
  const [requestLoading, setRequestLoading] = useState(false);
  const [nomenclatures, setNomenclatures] = useState<any[]>([]);

  useEffect(() => {
    apiClient.get('/api/v1/nomenclatures?category=request_type').then(r => setNomenclatures(r.data.data || [])).catch(() => {});
  }, []);

  async function trackRequest() {
    if (!trackingCode.trim()) return;
    setSearchLoading(true); setTrackingError(''); setTrackingResult(null);
    try {
      const r = await apiClient.get(`/api/v1/requests/track/${trackingCode}`);
      setTrackingResult(r.data.data);
    } catch { setTrackingError('Codul introdus nu a fost găsit.'); }
    finally { setSearchLoading(false); }
  }

  async function submitRequest() {
    setRequestError(''); setRequestLoading(true);
    try {
      await apiClient.post('/api/v1/public/requests', requestForm);
      setRequestSent(true);
    } catch (e: any) { setRequestError(e.response?.data?.error || 'Eroare.'); }
    finally { setRequestLoading(false); }
  }

  return (
    <Box style={{ minHeight: '100vh', background: 'var(--arcdoc-bg)' }}>
      {/* Header */}
      <Box style={{ background: 'var(--arcdoc-gradient)', padding: '3rem 1.5rem', color: 'white' }}>
        <Box style={{ maxWidth: 1200, margin: '0 auto' }}>
          <Group gap={12} mb="md">
            <IconArchive size={32} />
            <Title order={2}>Portal Arhivă</Title>
          </Group>
          <Text size="lg" opacity={0.9}>Urmărește solicitările și depune cereri noi</Text>
        </Box>
      </Box>

      <Box style={{ maxWidth: 1200, margin: '0 auto', padding: '2rem 1.5rem' }}>
        <SimpleGrid cols={{ base: 1, md: 2 }} spacing="lg" mb="xl">
          {/* Tracking */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
            <Paper p="xl" radius="lg" withBorder>
              <Title order={5} mb="md">Urmărește o solicitare</Title>
              <Group>
                <TextInput placeholder="Cod unic de urmărire" value={trackingCode} onChange={e => setTrackingCode(e.target.value)}
                  style={{ flex: 1 }} />
                <Button onClick={trackRequest} loading={searchLoading}>Caută</Button>
              </Group>
              {trackingError && <Text c="red" size="sm" mt="sm">{trackingError}</Text>}
              {trackingResult && (
                <Box mt="md" p="md" style={{ background: 'var(--arcdoc-surface-hover)', borderRadius: 'var(--arcdoc-radius-md)' }}>
                  <Group mb="xs">
                    <Badge color="blue" variant="light">#{trackingResult.number || trackingResult.id?.slice(0, 8)}</Badge>
                    <Badge color={trackingResult.status === 'completed' ? 'green' : trackingResult.status === 'approved' ? 'teal' : 'yellow'}>
                      {trackingResult.status}
                    </Badge>
                  </Group>
                  <Text size="sm" fw={500}>{trackingResult.request_type}</Text>
                  <Text size="xs" c="dimmed">Creat: {trackingResult.created_at ? new Date(trackingResult.created_at).toLocaleDateString('ro') : '-'}</Text>
                </Box>
              )}
            </Paper>
          </motion.div>

          {/* Quick Request */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
            <Paper p="xl" radius="lg" withBorder>
              {requestSent ? (
                <Box ta="center" py="lg">
                  <IconCheck size={48} style={{ color: 'var(--arcdoc-success-500)' }} />
                  <Title order={5} mt="md">Solicitare trimisă</Title>
                  <Text size="sm" c="dimmed" mt="xs">Veți fi contactat în cel mai scurt timp.</Text>
                </Box>
              ) : (
                <>
                  <Title order={5} mb="md">Solicitare nouă</Title>
                  {requestError && <Alert icon={<IconAlertCircle size={16} />} color="red" mb="md">{requestError}</Alert>}
                  <Stack>
                    <Group grow>
                      <TextInput label="Nume" value={requestForm.name} onChange={e => setRequestForm({...requestForm, name: e.target.value})} required />
                      <TextInput label="Email" value={requestForm.email} onChange={e => setRequestForm({...requestForm, email: e.target.value})} required />
                    </Group>
                    <TextInput label="Telefon" value={requestForm.phone} onChange={e => setRequestForm({...requestForm, phone: e.target.value})} />
                    <Select label="Tip solicitare" data={nomenclatures.map((n: any) => ({ value: n.code, label: n.name }))}
                      value={requestForm.requestType} onChange={v => setRequestForm({...requestForm, requestType: v || ''})} />
                    <Textarea label="Detalii" value={requestForm.details} onChange={e => setRequestForm({...requestForm, details: e.target.value})} />
                    <Button onClick={submitRequest} loading={requestLoading} leftSection={<IconSend size={16} />}>Trimite</Button>
                  </Stack>
                </>
              )}
            </Paper>
          </motion.div>
        </SimpleGrid>

        {/* Info Cards */}
        <SimpleGrid cols={{ base: 1, sm: 2, lg: 4 }} spacing="md">
          {[
            { icon: IconFileText, title: 'Documente', desc: 'Accesați documentele din arhiva digitală' },
            { icon: IconSearch, title: 'Căutare', desc: 'Căutați rapid documente după orice criteriu' },
            { icon: IconSend, title: 'Solicitări', desc: 'Depuneți cereri de consultare sau copiere' },
            { icon: IconCheck, title: 'Status', desc: 'Verificați stadiul solicitărilor dvs.' },
          ].map((c, i) => (
            <motion.div key={i} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 + i * 0.05 }}>
              <Paper p="lg" radius="lg" withBorder className="arcdoc-card" style={{ cursor: 'default' }}>
                <c.icon size={28} style={{ color: 'var(--arcdoc-primary-500)', marginBottom: '0.75rem' }} />
                <Text fw={600} size="sm" mb={4}>{c.title}</Text>
                <Text size="xs" c="dimmed">{c.desc}</Text>
              </Paper>
            </motion.div>
          ))}
        </SimpleGrid>

        <Text ta="center" size="xs" c="dimmed" mt="xl">&copy; {new Date().getFullYear()} ArcDoc Enterprise</Text>
      </Box>
    </Box>
  );
}

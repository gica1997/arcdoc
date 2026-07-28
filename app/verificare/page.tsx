'use client';

import { useState, useEffect } from 'react';
import { Title, Paper, TextInput, Button, Alert, Stack, Group, Badge, Box, Text, SimpleGrid } from '@mantine/core';
import { IconSearch, IconCheck, IconX, IconAlertCircle, IconShield } from '@tabler/icons-react';
import apiClient from '@/services/api';
import { motion } from 'framer-motion';

export default function VerifyPage() {
  const [code, setCode] = useState('');
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [recentVerifications, setRecentVerifications] = useState<any[]>([]);

  useEffect(() => {
    apiClient.get('/api/v1/verifications/recent').then(r => setRecentVerifications(r.data.data || [])).catch(() => {});
  }, []);

  async function verify() {
    if (!code.trim()) return;
    setLoading(true); setError(''); setResult(null);
    try {
      const r = await apiClient.get(`/api/v1/verifications/check/${code}`);
      setResult(r.data.data);
    } catch {
      setError('Cod invalid sau documentul nu a fost găsit în arhivă.');
    } finally { setLoading(false); }
  }

  return (
    <div className="page-container animate-fade-in">
      <Box mb="xl">
        <Group gap={12}>
          <IconShield size={28} style={{ color: 'var(--arcdoc-primary-500)' }} />
          <Box>
            <Text size="xs" tt="uppercase" fw={600} c="dimmed" mb={2}>Verificare</Text>
            <Title order={3} fw={700}>Verificare documente</Title>
            <Text c="dimmed" size="sm">Verificați autenticitatea documentelor din arhivă</Text>
          </Box>
        </Group>
      </Box>

      <SimpleGrid cols={{ base: 1, md: 3 }} spacing="lg">
        <Paper p="xl" radius="lg" withBorder>
          <Text fw={600} size="md" mb="md">Verifică un document</Text>
          <Stack>
            <TextInput
              placeholder="Cod de verificare"
              value={code}
              onChange={e => setCode(e.target.value)}
              leftSection={<IconSearch size={16} />}
              size="lg"
              styles={{ input: { fontSize: '1rem', letterSpacing: '0.05em' } }}
            />
            <Button onClick={verify} loading={loading} size="md">Verifică</Button>
          </Stack>
          {error && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="mt-4">
              <Alert icon={<IconAlertCircle size={16} />} color="red" mt="md">{error}</Alert>
            </motion.div>
          )}
          {result && (
            <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
              <Box mt="md" p="md" style={{ background: 'var(--arcdoc-surface-hover)', borderRadius: 'var(--arcdoc-radius-md)' }}>
                <Group mb="sm">
                  {result.valid ? (
                    <IconCheck size={24} style={{ color: 'var(--arcdoc-success-500)' }} />
                  ) : (
                    <IconX size={24} style={{ color: 'var(--arcdoc-danger-500)' }} />
                  )}
                  <Badge color={result.valid ? 'green' : 'red'} size="lg">
                    {result.valid ? 'Document autentic' : 'Document neidentificat'}
                  </Badge>
                </Group>
                {result.document && (
                  <>
                    <Text size="sm" fw={500}>{result.document.title}</Text>
                    <Text size="xs" c="dimmed">{result.document.code} · {result.document.date}</Text>
                  </>
                )}
              </Box>
            </motion.div>
          )}
        </Paper>

        <Paper p="xl" radius="lg" withBorder>
          <Text fw={600} size="md" mb="md">Verificări recente</Text>
          {recentVerifications.length === 0 ? (
            <Text size="sm" c="dimmed">Nu există verificări recente.</Text>
          ) : (
            <Stack gap="sm">
              {recentVerifications.slice(0, 5).map((v, i) => (
                <Group key={i} gap="sm" p="xs" style={{ borderRadius: 'var(--arcdoc-radius-sm)', background: i % 2 ? 'var(--arcdoc-surface-hover)' : 'transparent' }}>
                  {v.valid ? <IconCheck size={14} style={{ color: 'var(--arcdoc-success-500)' }} /> : <IconX size={14} style={{ color: 'var(--arcdoc-danger-500)' }} />}
                  <Box>
                    <Text size="xs" fw={500}>{v.code}</Text>
                    <Text size="xs" c="dimmed">{v.created_at ? new Date(v.created_at).toLocaleDateString('ro') : '-'}</Text>
                  </Box>
                </Group>
              ))}
            </Stack>
          )}
        </Paper>

        <Paper p="xl" radius="lg" withBorder>
          <Text fw={600} size="md" mb="md">Despre verificare</Text>
          <Text size="sm" c="dimmed">
            Sistemul de verificare ArcDoc utilizează coduri unice de autentificare
            pentru fiecare document înregistrat în arhivă. Introduceți codul de
            pe document pentru a verifica autenticitatea acestuia.
          </Text>
        </Paper>
      </SimpleGrid>
    </div>
  );
}

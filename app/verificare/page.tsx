'use client';
import { useState } from 'react';
import { Container, Title, Paper, TextInput, Button, Stack, Text, Alert, Badge } from '@mantine/core';
import { IconSearch, IconCheck, IconX } from '@tabler/icons-react';
import apiClient from '@/services/api';

export default function VerificationPage() {
  const [code, setCode] = useState('');
  const [result, setResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function verify() {
    if (!code.trim()) return;
    setLoading(true); setError(''); setResult(null);
    try {
      const r = await apiClient.get(`/api/v1/documents/search?q=${code}`);
      const docs = r.data.data || [];
      if (docs.length > 0) {
        setResult({ valid: true, document: docs[0] });
      } else {
        setResult({ valid: false });
      }
    } catch (e: any) {
      setError('Eroare la verificare. Încercați din nou.');
    } finally { setLoading(false); }
  }

  return (
    <Container size="xs" my="xl">
      <Title order={3} ta="center" mb="lg">Verificare Document</Title>
      <Paper withBorder p="xl" radius="md">
        <Stack>
          <Text size="sm" c="dimmed" ta="center">Introduceți codul QR, codul de bare sau numărul documentului pentru verificare.</Text>
          <TextInput placeholder="Cod document" leftSection={<IconSearch size={16} />} value={code} onChange={e => setCode(e.target.value)} onKeyDown={e => e.key === 'Enter' && verify()} />
          <Button onClick={verify} loading={loading}>Verifică</Button>
          {error && <Alert color="red">{error}</Alert>}
          {result && (
            <Alert color={result.valid ? 'green' : 'red'} icon={result.valid ? <IconCheck size={16} /> : <IconX size={16} />}>
              {result.valid ? (
                <Stack gap={4}>
                  <Text fw={500}>Document valid</Text>
                  <Text size="sm">Titlu: {result.document.title}</Text>
                  <Text size="sm">Cod: {result.document.code}</Text>
                  <Text size="sm">Status: <Badge size="xs" color={result.document.status === 'available' ? 'green' : 'orange'}>{result.document.status}</Badge></Text>
                </Stack>
              ) : (
                <Text>Documentul nu a fost găsit în sistem.</Text>
              )}
            </Alert>
          )}
        </Stack>
      </Paper>
    </Container>
  );
}
'use client';

import { useState } from 'react';
import { Container, Paper, Title, PasswordInput, Button, Alert } from '@mantine/core';
import { IconLock, IconAlertCircle, IconCheck } from '@tabler/icons-react';
import { useSearchParams } from 'next/navigation';
import apiClient from '@/services/api';

export default function ResetPasswordPage() {
  const searchParams = useSearchParams();
  const token = searchParams.get('token') || '';
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [done, setDone] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault(); setError('');
    if (password !== confirm) { setError('Parolele nu coincid.'); return; }
    setLoading(true);
    try {
      await apiClient.post('/api/v1/auth/reset-password', { token, password });
      setDone(true);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Eroare.');
    } finally { setLoading(false); }
  }

  if (!token) return <Container size={420} my={80}><Alert color="red">Token lipsă.</Alert></Container>;

  return (
    <Container size={420} my={80}>
      <Title ta="center" mb="lg">Setează parola nouă</Title>
      <Paper withBorder shadow="md" p={30} radius="md">
        {done ? (
          <Alert icon={<IconCheck size={16} />} color="green">Parola a fost resetată. Vă puteți autentifica acum.</Alert>
        ) : (
          <form onSubmit={handleSubmit}>
            {error && <Alert icon={<IconAlertCircle size={16} />} color="red" mb="md">{error}</Alert>}
            <PasswordInput label="Parola nouă" leftSection={<IconLock size={16} />}
              value={password} onChange={(e) => setPassword(e.target.value)} required />
            <PasswordInput label="Confirmă parola" leftSection={<IconLock size={16} />} mt="md"
              value={confirm} onChange={(e) => setConfirm(e.target.value)} required />
            <Button fullWidth mt="xl" type="submit" loading={loading}>Resetează parola</Button>
          </form>
        )}
      </Paper>
    </Container>
  );
}
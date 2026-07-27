'use client';

import { useState } from 'react';
import { Container, Paper, Title, TextInput, Button, Alert } from '@mantine/core';
import { IconMail, IconAlertCircle, IconCheck } from '@tabler/icons-react';
import apiClient from '@/services/api';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [sent, setSent] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault(); setError(''); setLoading(true);
    try {
      await apiClient.post('/api/v1/auth/forgot-password', { email });
      setSent(true);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Eroare.');
    } finally { setLoading(false); }
  }

  return (
    <Container size={420} my={80}>
      <Title ta="center" mb="lg">Resetare parolă</Title>
      <Paper withBorder shadow="md" p={30} radius="md">
        {sent ? (
          <Alert icon={<IconCheck size={16} />} color="green">
            Dacă adresa de email există, veți primi instrucțiuni de resetare.
          </Alert>
        ) : (
          <form onSubmit={handleSubmit}>
            {error && <Alert icon={<IconAlertCircle size={16} />} color="red" mb="md">{error}</Alert>}
            <TextInput label="Email" placeholder="email@exemplu.ro" leftSection={<IconMail size={16} />}
              value={email} onChange={(e) => setEmail(e.target.value)} required />
            <Button fullWidth mt="xl" type="submit" loading={loading}>Trimite instrucțiuni</Button>
          </form>
        )}
      </Paper>
    </Container>
  );
}
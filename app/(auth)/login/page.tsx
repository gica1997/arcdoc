'use client';

import { useState } from 'react';
import {
  Container, Paper, Title, TextInput, PasswordInput, Button, Text, Anchor, Group, Checkbox, Alert,
} from '@mantine/core';
import { IconMail, IconLock, IconAlertCircle } from '@tabler/icons-react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/hooks/useAuth';
import apiClient from '@/services/api';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const router = useRouter();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await login({ email, password });
      router.push('/dashboard');
    } catch (err: any) {
      setError(err.response?.data?.error || err.message || 'Eroare la autentificare.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <Container size={420} my={80}>
      <Title ta="center" mb="lg">ArcDoc Enterprise</Title>
      <Paper withBorder shadow="md" p={30} radius="md">
        <form onSubmit={handleSubmit}>
          {error && <Alert icon={<IconAlertCircle size={16} />} color="red" mb="md">{error}</Alert>}
          <TextInput label="Email" placeholder="email@exemplu.ro" leftSection={<IconMail size={16} />}
            value={email} onChange={(e) => setEmail(e.target.value)} required />
          <PasswordInput label="Parolă" placeholder="Parola" leftSection={<IconLock size={16} />} mt="md"
            value={password} onChange={(e) => setPassword(e.target.value)} required />
          <Group justify="space-between" mt="md">
            <Checkbox label="Ține-mă minte" checked={rememberMe} onChange={(e) => setRememberMe(e.currentTarget.checked)} />
            <Anchor component={Link} href="/forgot-password" size="sm">Ai uitat parola?</Anchor>
          </Group>
          <Button fullWidth mt="xl" type="submit" loading={loading}>Autentificare</Button>
        </form>
      </Paper>
    </Container>
  );
}
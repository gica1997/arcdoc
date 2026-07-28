'use client';

import { useState } from 'react';
import { Paper, Title, TextInput, Button, Alert, Box, Text, Anchor, Stack } from '@mantine/core';
import { IconMail, IconAlertCircle, IconCheck, IconArchive } from '@tabler/icons-react';
import Link from 'next/link';
import apiClient from '@/services/api';
import { motion } from 'framer-motion';

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
    } catch (err: any) { setError(err.response?.data?.error || 'Eroare.'); }
    finally { setLoading(false); }
  }

  return (
    <Box style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'linear-gradient(135deg, var(--arcdoc-bg) 0%, #eef2ff 50%, #e0e7ff 100%)' }}>
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} style={{ width: '100%', maxWidth: 420, padding: '1rem' }}>
        <Box ta="center" mb="xl">
          <Box style={{ width: 48, height: 48, borderRadius: 'var(--arcdoc-radius-lg)', background: 'var(--arcdoc-gradient)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 0.75rem', boxShadow: '0 8px 24px rgba(99,102,241,0.3)' }}>
            <IconArchive size={24} color="white" />
          </Box>
          <Title order={4} fw={700}>Resetare parolă</Title>
        </Box>

        <Paper p="xl" radius="xl" style={{ background: 'var(--arcdoc-glass-bg)', backdropFilter: 'var(--arcdoc-glass-blur)', border: 'var(--arcdoc-glass-border)', boxShadow: '0 20px 60px rgba(0,0,0,0.08)' }}>
          {sent ? (
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}>
              <Alert icon={<IconCheck size={16} />} color="green" styles={{ root: { borderRadius: 'var(--arcdoc-radius-md)' } }}>
                Dacă adresa de email există, veți primi instrucțiuni de resetare.
              </Alert>
              <Anchor component={Link} href="/login" size="sm" mt="md" style={{ display: 'block', textAlign: 'center' }}>Înapoi la autentificare</Anchor>
            </motion.div>
          ) : (
            <form onSubmit={handleSubmit}>
              <Stack gap="md">
                <Text size="sm" c="dimmed">Introduceți adresa de email și veți primi instrucțiuni pentru resetarea parolei.</Text>
                {error && <Alert icon={<IconAlertCircle size={16} />} color="red" styles={{ root: { borderRadius: 'var(--arcdoc-radius-md)' } }}>{error}</Alert>}
                <TextInput label="Email" placeholder="email@exemplu.ro" leftSection={<IconMail size={16} />} value={email} onChange={(e) => setEmail(e.target.value)} required />
                <Button fullWidth type="submit" loading={loading} styles={{ root: { background: 'var(--arcdoc-gradient)', border: 'none', height: 44, fontWeight: 600 } }}>Trimite instrucțiuni</Button>
                <Anchor component={Link} href="/login" size="sm" ta="center">Înapoi la autentificare</Anchor>
              </Stack>
            </form>
          )}
        </Paper>
      </motion.div>
    </Box>
  );
}

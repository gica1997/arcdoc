'use client';

import { useState } from 'react';
import {
  Paper, Title, TextInput, PasswordInput, Button, Text, Anchor, Group, Checkbox, Alert, Box, Stack,
} from '@mantine/core';
import { IconMail, IconLock, IconAlertCircle, IconArchive, IconArrowRight } from '@tabler/icons-react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/hooks/useAuth';
import { motion } from 'framer-motion';

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
    <Box
      style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'linear-gradient(135deg, var(--arcdoc-bg) 0%, #eef2ff 50%, #e0e7ff 100%)',
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      {/* Background decorative elements */}
      <Box
        style={{
          position: 'absolute',
          top: '-20%',
          right: '-10%',
          width: 500,
          height: 500,
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(99,102,241,0.08) 0%, transparent 70%)',
          pointerEvents: 'none',
        }}
      />
      <Box
        style={{
          position: 'absolute',
          bottom: '-15%',
          left: '-5%',
          width: 400,
          height: 400,
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(6,182,212,0.06) 0%, transparent 70%)',
          pointerEvents: 'none',
        }}
      />

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: 'easeOut' }}
        style={{ width: '100%', maxWidth: 440, padding: '1rem', position: 'relative', zIndex: 1 }}
      >
        {/* Logo */}
        <Box ta="center" mb="xl">
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.1, duration: 0.3 }}
          >
            <Box
              style={{
                width: 56, height: 56,
                borderRadius: 'var(--arcdoc-radius-xl)',
                background: 'var(--arcdoc-gradient)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                margin: '0 auto 1rem',
                boxShadow: '0 8px 24px rgba(99,102,241,0.3)',
              }}
            >
              <IconArchive size={28} color="white" />
            </Box>
            <Title order={3} fw={700}>ArcDoc Enterprise</Title>
            <Text c="dimmed" size="sm" mt={4}>
              Platformă premium pentru managementul arhivei
            </Text>
          </motion.div>
        </Box>

        {/* Login Card */}
        <Paper
          p="xl"
          radius="xl"
          style={{
            background: 'var(--arcdoc-glass-bg)',
            backdropFilter: 'var(--arcdoc-glass-blur)',
            WebkitBackdropFilter: 'var(--arcdoc-glass-blur)',
            border: 'var(--arcdoc-glass-border)',
            boxShadow: '0 20px 60px rgba(0,0,0,0.08)',
          }}
        >
          <form onSubmit={handleSubmit}>
            <Stack gap="md">
              <Box mb="xs">
                <Title order={5} fw={600}>Autentificare</Title>
                <Text size="sm" c="dimmed">Introduceți credențialele pentru a continua</Text>
              </Box>

              {error && (
                <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }}>
                  <Alert
                    icon={<IconAlertCircle size={16} />}
                    color="red"
                    variant="light"
                    styles={{ root: { borderRadius: 'var(--arcdoc-radius-md)' } }}
                  >
                    {error}
                  </Alert>
                </motion.div>
              )}

              <TextInput
                label="Email"
                placeholder="nume@companie.ro"
                leftSection={<IconMail size={16} />}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                styles={{
                  input: {
                    background: 'var(--arcdoc-surface)',
                    border: '1px solid var(--arcdoc-border)',
                    '&:focus': { borderColor: 'var(--arcdoc-primary-400)', boxShadow: '0 0 0 3px rgba(99,102,241,0.1)' },
                  },
                }}
              />

              <PasswordInput
                label="Parolă"
                placeholder="Introduceți parola"
                leftSection={<IconLock size={16} />}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                styles={{
                  input: {
                    background: 'var(--arcdoc-surface)',
                    border: '1px solid var(--arcdoc-border)',
                    '&:focus': { borderColor: 'var(--arcdoc-primary-400)', boxShadow: '0 0 0 3px rgba(99,102,241,0.1)' },
                  },
                }}
              />

              <Group justify="space-between">
                <Checkbox
                  label="Ține-mă minte"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.currentTarget.checked)}
                  color="arcdoc-primary"
                />
                <Anchor component={Link} href="/forgot-password" size="sm" c="arcdoc-primary">
                  Ai uitat parola?
                </Anchor>
              </Group>

              <Button
                fullWidth
                size="md"
                type="submit"
                loading={loading}
                rightSection={<IconArrowRight size={18} />}
                styles={{
                  root: {
                    background: 'var(--arcdoc-gradient)',
                    border: 'none',
                    height: 44,
                    fontWeight: 600,
                    '&:hover': {
                      boxShadow: '0 4px 14px rgba(99,102,241,0.4)',
                      transform: 'translateY(-1px)',
                    },
                    transition: 'all 0.15s',
                  },
                }}
              >
                Autentificare
              </Button>
            </Stack>
          </form>
        </Paper>

        {/* Footer */}
        <Text ta="center" size="xs" c="dimmed" mt="xl">
          &copy; {new Date().getFullYear()} ArcDoc Enterprise. Toate drepturile rezervate.
        </Text>
      </motion.div>
    </Box>
  );
}

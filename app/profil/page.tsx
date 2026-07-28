'use client';

import { useState, useEffect } from 'react';
import {
  Title, Paper, TextInput, Button, Alert, Stack, Group, Avatar, Box, Text,
  PasswordInput, SimpleGrid,
} from '@mantine/core';
import { IconCheck, IconAlertCircle, IconUser, IconMail, IconPhone, IconLock } from '@tabler/icons-react';
import { useAuth } from '@/hooks/useAuth';
import apiClient from '@/services/api';
import { motion } from 'framer-motion';

export default function ProfilePage() {
  const { user, refresh } = useAuth();
  const [form, setForm] = useState({ firstName: '', lastName: '', email: '', phone: '' });
  const [passwordForm, setPasswordForm] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' });
  const [msg, setMsg] = useState('');
  const [pwMsg, setPwMsg] = useState('');
  const [loading, setLoading] = useState(false);
  const [pwLoading, setPwLoading] = useState(false);

  useEffect(() => {
    if (user) setForm({ firstName: user.firstName || '', lastName: user.lastName || '', email: user.email || '', phone: user.phone || '' });
  }, [user]);

  async function saveProfile() {
    setMsg(''); setLoading(true);
    try { await apiClient.put('/api/v1/users/me', form); setMsg('Profil actualizat.'); refresh(); }
    catch (e: any) { setMsg(e.response?.data?.error || 'Eroare.'); }
    finally { setLoading(false); }
  }

  async function changePassword() {
    if (passwordForm.newPassword !== passwordForm.confirmPassword) { setPwMsg('Parolele nu coincid.'); return; }
    setPwMsg(''); setPwLoading(true);
    try { await apiClient.post('/api/v1/auth/change-password', passwordForm); setPwMsg('Parolă schimbată.'); setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' }); }
    catch (e: any) { setPwMsg(e.response?.data?.error || 'Eroare.'); }
    finally { setPwLoading(false); }
  }

  const initials = `${form.firstName?.[0] || ''}${form.lastName?.[0] || ''}`;

  return (
    <div className="page-container animate-fade-in">
      <Box mb="xl">
        <Text size="xs" tt="uppercase" fw={600} c="dimmed" mb={4}>Cont</Text>
        <Title order={3} fw={700}>Profilul meu</Title>
        <Text c="dimmed" size="sm">Gestionați informațiile personale și securitatea contului</Text>
      </Box>

      <SimpleGrid cols={{ base: 1, md: 2 }} spacing="lg">
        {/* Profile */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <Paper p="lg" radius="lg" withBorder>
            <Group mb="lg">
              <Avatar size={64} radius="xl" color="arcdoc-primary" style={{ border: '3px solid var(--arcdoc-primary-200)' }}>{initials}</Avatar>
              <Box>
                <Text fw={600}>{form.firstName} {form.lastName}</Text>
                <Text size="sm" c="dimmed">{form.email}</Text>
              </Box>
            </Group>
            {msg && <Alert icon={msg.includes('actualizat') ? <IconCheck size={16} /> : <IconAlertCircle size={16} />} color={msg.includes('actualizat') ? 'green' : 'red'} mb="md">{msg}</Alert>}
            <Stack>
              <Group grow>
                <TextInput label="Prenume" value={form.firstName} onChange={e => setForm({ ...form, firstName: e.target.value })} />
                <TextInput label="Nume" value={form.lastName} onChange={e => setForm({ ...form, lastName: e.target.value })} />
              </Group>
              <TextInput label="Email" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} leftSection={<IconMail size={14} />} />
              <TextInput label="Telefon" value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} leftSection={<IconPhone size={14} />} />
              <Button onClick={saveProfile} loading={loading}>Salvează profilul</Button>
            </Stack>
          </Paper>
        </motion.div>

        {/* Password */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
          <Paper p="lg" radius="lg" withBorder>
            <Text fw={600} size="md" mb="lg">Schimbă parola</Text>
            {pwMsg && <Alert icon={pwMsg.includes('schimbată') ? <IconCheck size={16} /> : <IconAlertCircle size={16} />} color={pwMsg.includes('schimbată') ? 'green' : 'red'} mb="md">{pwMsg}</Alert>}
            <Stack>
              <PasswordInput label="Parola curentă" value={passwordForm.currentPassword}
                onChange={e => setPasswordForm({ ...passwordForm, currentPassword: e.target.value })} />
              <PasswordInput label="Parola nouă" value={passwordForm.newPassword}
                onChange={e => setPasswordForm({ ...passwordForm, newPassword: e.target.value })} />
              <PasswordInput label="Confirmă parola" value={passwordForm.confirmPassword}
                onChange={e => setPasswordForm({ ...passwordForm, confirmPassword: e.target.value })} />
              <Button onClick={changePassword} loading={pwLoading} leftSection={<IconLock size={16} />}>Schimbă parola</Button>
            </Stack>
          </Paper>
        </motion.div>
      </SimpleGrid>
    </div>
  );
}

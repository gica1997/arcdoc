'use client';

import { useState, useEffect } from 'react';
import {
  Container, Title, Paper, Grid, TextInput, PasswordInput, Button, Alert, Group, Text, Box, Tabs,
} from '@mantine/core';
import { IconAlertCircle, IconCheck, IconUser, IconLock } from '@tabler/icons-react';
import { useAuth } from '@/hooks/useAuth';
import apiClient from '@/services/api';

export default function ProfilePage() {
  const { user, updateUser } = useAuth();
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [phone, setPhone] = useState('');
  const [currentPwd, setCurrentPwd] = useState('');
  const [newPwd, setNewPwd] = useState('');
  const [confirmPwd, setConfirmPwd] = useState('');
  const [msg, setMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (user) {
      setFirstName(user.firstName);
      setLastName(user.lastName);
      setPhone((user as any).phone || '');
    }
  }, [user]);

  async function saveProfile(e: React.FormEvent) {
    e.preventDefault(); setMsg(null); setLoading(true);
    try {
      const res = await apiClient.put(`/api/v1/users/${user!.id}`, { firstName, lastName, phone });
      updateUser({ ...user!, firstName, lastName });
      setMsg({ type: 'success', text: 'Profil actualizat.' });
    } catch (err: any) {
      setMsg({ type: 'error', text: err.response?.data?.error || 'Eroare.' });
    } finally { setLoading(false); }
  }

  async function changePwd(e: React.FormEvent) {
    e.preventDefault(); setMsg(null);
    if (newPwd !== confirmPwd) { setMsg({ type: 'error', text: 'Parolele nu coincid.' }); return; }
    setLoading(true);
    try {
      await apiClient.post('/api/v1/auth/change-password', { currentPassword: currentPwd, newPassword: newPwd });
      setCurrentPwd(''); setNewPwd(''); setConfirmPwd('');
      setMsg({ type: 'success', text: 'Parola schimbată.' });
    } catch (err: any) {
      setMsg({ type: 'error', text: err.response?.data?.error || 'Eroare.' });
    } finally { setLoading(false); }
  }

  return (
    <Container size="md" py="md">
      <Title order={3} mb="lg">Profilul meu</Title>
      {msg && <Alert icon={msg.type === 'success' ? <IconCheck size={16} /> : <IconAlertCircle size={16} />} color={msg.type === 'success' ? 'green' : 'red'} mb="md">{msg.text}</Alert>}
      <Tabs defaultValue="info">
        <Tabs.List>
          <Tabs.Tab value="info" leftSection={<IconUser size={14} />}>Informații</Tabs.Tab>
          <Tabs.Tab value="password" leftSection={<IconLock size={14} />}>Schimbă parola</Tabs.Tab>
        </Tabs.List>
        <Tabs.Panel value="info" pt="md">
          <Paper withBorder p="md">
            <form onSubmit={saveProfile}>
              <Grid>
                <Grid.Col span={{ base: 12, sm: 6 }}>
                  <TextInput label="Prenume" value={firstName} onChange={(e) => setFirstName(e.target.value)} required />
                </Grid.Col>
                <Grid.Col span={{ base: 12, sm: 6 }}>
                  <TextInput label="Nume" value={lastName} onChange={(e) => setLastName(e.target.value)} required />
                </Grid.Col>
                <Grid.Col span={12}>
                  <TextInput label="Email" value={user?.email || ''} disabled />
                </Grid.Col>
                <Grid.Col span={12}>
                  <TextInput label="Telefon" value={phone} onChange={(e) => setPhone(e.target.value)} />
                </Grid.Col>
              </Grid>
              <Button mt="md" type="submit" loading={loading}>Salvează</Button>
            </form>
          </Paper>
        </Tabs.Panel>
        <Tabs.Panel value="password" pt="md">
          <Paper withBorder p="md">
            <form onSubmit={changePwd}>
              <PasswordInput label="Parola curentă" value={currentPwd} onChange={(e) => setCurrentPwd(e.target.value)} required mb="sm" />
              <PasswordInput label="Parola nouă" value={newPwd} onChange={(e) => setNewPwd(e.target.value)} required mb="sm" />
              <PasswordInput label="Confirmă parola nouă" value={confirmPwd} onChange={(e) => setConfirmPwd(e.target.value)} required mb="md" />
              <Button type="submit" loading={loading}>Schimbă parola</Button>
            </form>
          </Paper>
        </Tabs.Panel>
      </Tabs>
    </Container>
  );
}
// ============================================
// ArcDoc Enterprise - Portal Security Settings
// ============================================

'use client';

import { useState } from 'react';
import {
  Container, Title, Paper, PasswordInput, Button, Alert, Stack, Text, Group, Divider,
  Switch, Box, Badge, Tooltip, List, Grid,
} from '@mantine/core';
import { IconCheck, IconAlertCircle, IconLock, IconShield, IconHistory, IconDevices, IconKey } from '@tabler/icons-react';
import { useAuth } from '@/hooks/useAuth';
import apiClient from '@/services/api';

export default function PortalSecurityPage() {
  const { user } = useAuth();
  const [currentPwd, setCurrentPwd] = useState('');
  const [newPwd, setNewPwd] = useState('');
  const [confirmPwd, setConfirmPwd] = useState('');
  const [msg, setMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [loading, setLoading] = useState(false);

  async function changePassword(e: React.FormEvent) {
    e.preventDefault();
    setMsg(null);

    if (newPwd !== confirmPwd) {
      setMsg({ type: 'error', text: 'Parolele noi nu coincid.' });
      return;
    }
    if (newPwd.length < 8) {
      setMsg({ type: 'error', text: 'Parola trebuie să aibă cel puțin 8 caractere.' });
      return;
    }

    setLoading(true);
    try {
      await apiClient.post('/api/v1/auth/change-password', {
        currentPassword: currentPwd,
        newPassword: newPwd,
      });
      setCurrentPwd(''); setNewPwd(''); setConfirmPwd('');
      setMsg({ type: 'success', text: 'Parola a fost schimbată cu succes.' });
    } catch (err: any) {
      setMsg({ type: 'error', text: err.response?.data?.error || 'Eroare la schimbarea parolei.' });
    } finally { setLoading(false); }
  }

  const passwordChecks = [
    { label: 'Cel puțin 8 caractere', check: newPwd.length >= 8 },
    { label: 'Conține literă mare', check: /[A-Z]/.test(newPwd) },
    { label: 'Conține literă mică', check: /[a-z]/.test(newPwd) },
    { label: 'Conține cifră', check: /\d/.test(newPwd) },
    { label: 'Conține caracter special', check: /[!@#$%^&*(),.?":{}|<>]/.test(newPwd) },
  ];

  return (
    <Box p="xl">
      <Title order={3} mb="md">
        <Group gap={8}>
          <IconShield size={24} />
          Securitate Cont
        </Group>
      </Title>

      <Grid>
        {/* Change Password */}
        <Grid.Col span={{ base: 12, md: 7 }}>
          <Paper withBorder p="md" radius="md">
            <Title order={5} mb="md">
              <Group gap={6}>
                <IconLock size={18} />
                Schimbă Parola
              </Group>
            </Title>

            {msg && (
              <Alert icon={msg.type === 'success' ? <IconCheck size={16} /> : <IconAlertCircle size={16} />}
                color={msg.type === 'success' ? 'green' : 'red'} mb="md">
                {msg.text}
              </Alert>
            )}

            <form onSubmit={changePassword}>
              <Stack>
                <PasswordInput label="Parola curentă" value={currentPwd}
                  onChange={e => setCurrentPwd(e.target.value)} required
                  description="Introdu parola actuală pentru verificare"
                />
                <PasswordInput label="Parola nouă" value={newPwd}
                  onChange={e => setNewPwd(e.target.value)} required
                  description="Minimum 8 caractere, literă mare, literă mică, cifră și caracter special"
                />
                <PasswordInput label="Confirmă parola nouă" value={confirmPwd}
                  onChange={e => setConfirmPwd(e.target.value)} required
                />

                {newPwd && (
                  <Paper p="sm" withBorder radius="sm">
                    <Text size="xs" fw={500} mb={4}>Cerințe parolă:</Text>
                    <List size="xs" spacing={2}>
                      {passwordChecks.map((c, i) => (
                        <List.Item key={i} icon={c.check ? <IconCheck size={12} color="green" /> : <IconAlertCircle size={12} color="red" />}>
                          {c.label}
                        </List.Item>
                      ))}
                    </List>
                  </Paper>
                )}

                <Button type="submit" loading={loading} leftSection={<IconKey size={16} />}>
                  Schimbă Parola
                </Button>
              </Stack>
            </form>
          </Paper>
        </Grid.Col>

        {/* Security Info */}
        <Grid.Col span={{ base: 12, md: 5 }}>
          <Paper withBorder p="md" radius="md" mb="md">
            <Title order={5} mb="md">
              <Group gap={6}>
                <IconShield size={18} />
                Status Securitate
              </Group>
            </Title>
            <Stack gap="sm">
              <Group justify="space-between">
                <Text size="sm">Autentificare</Text>
                <Badge color="green">Activă</Badge>
              </Group>
              <Group justify="space-between">
                <Text size="sm">Cont</Text>
                <Badge color="green">Verificat</Badge>
              </Group>
              <Group justify="space-between">
                <Text size="sm">Email</Text>
                <Badge color="blue">{user?.email || '-'}</Badge>
              </Group>
              <Divider />
              <Text size="xs" c="dimmed">
                Pentru securitate maximă, schimbă parola periodic și nu folosi aceeași parolă pentru alte servicii.
              </Text>
            </Stack>
          </Paper>

          <Paper withBorder p="md" radius="md">
            <Title order={5} mb="md">
              <Group gap={6}>
                <IconHistory size={18} />
                Sfaturi Securitate
              </Group>
            </Title>
            <List size="sm" spacing="xs">
              <List.Item icon={<IconCheck size={14} color="green" />}>
                Folosește o parolă unică, puternică
              </List.Item>
              <List.Item icon={<IconCheck size={14} color="green" />}>
                Activează autentificarea în doi pași
              </List.Item>
              <List.Item icon={<IconCheck size={14} color="green" />}>
                Nu împărtăși datele de autentificare
              </List.Item>
              <List.Item icon={<IconCheck size={14} color="green" />}>
                Deconectează-te după fiecare sesiune
              </List.Item>
              <List.Item icon={<IconCheck size={14} color="green" />}>
                Verifică periodic activitatea contului
              </List.Item>
            </List>
          </Paper>
        </Grid.Col>
      </Grid>
    </Box>
  );
}

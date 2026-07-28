'use client';

import { useState, useEffect } from 'react';
import { Title, Paper, Switch, Button, Alert, Stack, Group, Text, Box, Divider, Select, TextInput } from '@mantine/core';
import { IconCheck, IconAlertCircle, IconSettings } from '@tabler/icons-react';
import apiClient from '@/services/api';
import { motion } from 'framer-motion';

export default function SettingsPage() {
  const [settings, setSettings] = useState<Record<string, any>>({});
  const [msg, setMsg] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    apiClient.get('/api/v1/settings').then(r => {
      if (r.data.data) setSettings(r.data.data);
    }).catch(() => {});
  }, []);

  async function save() {
    setLoading(true); setMsg('');
    try { await apiClient.put('/api/v1/settings', settings); setMsg('Setări actualizate.'); }
    catch (e: any) { setMsg(e.response?.data?.error || 'Eroare.'); }
    finally { setLoading(false); }
  }

  return (
    <div className="page-container animate-fade-in">
      <Box mb="xl">
        <Text size="xs" tt="uppercase" fw={600} c="dimmed" mb={4}>Administrare</Text>
        <Title order={3} fw={700}>Setări sistem</Title>
        <Text c="dimmed" size="sm">Configurați parametrii globali ai platformei</Text>
      </Box>

      {msg && (
        <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }}>
          <Alert icon={msg.includes('actualizate') ? <IconCheck size={16} /> : <IconAlertCircle size={16} />}
            color={msg.includes('actualizate') ? 'green' : 'red'} mb="md">{msg}</Alert>
        </motion.div>
      )}

      <Stack>
        <Paper p="lg" radius="lg" withBorder>
          <Text fw={600} mb="md">Funcționalități</Text>
          <Stack>
            <Switch label="Permite înregistrare utilizatori externi" checked={settings.allowExternalRegistration ?? false}
              onChange={e => setSettings({ ...settings, allowExternalRegistration: e.currentTarget.checked })} />
            <Switch label="Activează notificări email" checked={settings.emailNotifications ?? true}
              onChange={e => setSettings({ ...settings, emailNotifications: e.currentTarget.checked })} />
            <Switch label="Necesită aprobare pentru solicitări" checked={settings.requireApproval ?? true}
              onChange={e => setSettings({ ...settings, requireApproval: e.currentTarget.checked })} />
            <Switch label="Activează împrumuturi automate" checked={settings.autoLoans ?? false}
              onChange={e => setSettings({ ...settings, autoLoans: e.currentTarget.checked })} />
          </Stack>
        </Paper>

        <Paper p="lg" radius="lg" withBorder>
          <Text fw={600} mb="md">Configurare</Text>
          <Stack>
            <Select label="Format dată implicit" data={[{ value: 'ro', label: 'RO (ZZ/LL/AAAA)' }, { value: 'iso', label: 'ISO (AAAA-LL-ZZ)' }, { value: 'us', label: 'US (MM/DD/AAAA)' }]}
              value={settings.dateFormat || 'ro'} onChange={v => setSettings({ ...settings, dateFormat: v || 'ro' })} />
            <TextInput label="Prefix număr document" value={settings.documentPrefix || ''}
              onChange={e => setSettings({ ...settings, documentPrefix: e.target.value })} />
          </Stack>
        </Paper>

        <Group justify="flex-end">
          <Button onClick={save} loading={loading} leftSection={<IconSettings size={16} />}>Salvează setările</Button>
        </Group>
      </Stack>
    </div>
  );
}

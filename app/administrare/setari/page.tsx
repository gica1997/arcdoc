'use client';

import { useState, useEffect } from 'react';
import { Title, Paper, TextInput, Button, Stack, Group, Alert, PasswordInput, Switch, Tabs } from '@mantine/core';
import { IconCheck } from '@tabler/icons-react';
import apiClient from '@/services/api';

export default function SettingsPage() {
  const [settings, setSettings] = useState<Record<string, string>>({});
  const [msg, setMsg] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    apiClient.get('/api/v1/settings').then(r => {
      const map: Record<string, string> = {};
      (r.data.data || []).forEach((s: any) => { map[s.key] = typeof s.value === 'object' ? JSON.stringify(s.value) : String(s.value); });
      setSettings(map);
    }).catch(() => {});
  }, []);

  async function save() {
    setLoading(true); setMsg('');
    try {
      const payload: Record<string, any> = {};
      for (const [k, v] of Object.entries(settings)) {
        try { payload[k] = JSON.parse(v); } catch { payload[k] = v; }
      }
      await apiClient.put('/api/v1/settings', payload);
      setMsg('Setări salvate.');
    } catch (e: any) { setMsg(e.response?.data?.error || 'Eroare.'); }
    finally { setLoading(false); }
  }

  function setK(key: string, value: string) { setSettings(prev => ({ ...prev, [key]: value })); }

  return (
    <div className="page-container">
      <Title order={3} mb="lg">Setări platformă</Title>
      {msg && <Alert color="green" mb="md"><IconCheck size={16} /> {msg}</Alert>}
      <Tabs defaultValue="general">
        <Tabs.List>
          <Tabs.Tab value="general">Generale</Tabs.Tab>
          <Tabs.Tab value="email">Email</Tabs.Tab>
          <Tabs.Tab value="notifications">Notificări</Tabs.Tab>
        </Tabs.List>

        <Tabs.Panel value="general" pt="md">
          <Paper withBorder p="md">
            <Stack>
              <TextInput label="Denumire platformă" value={settings.app_name || ''} onChange={e => setK('app_name', e.target.value)} />
              <TextInput label="Limbă implicită" value={settings.default_language || 'ro'} onChange={e => setK('default_language', e.target.value)} />
              <TextInput label="Fus orar" value={settings.timezone || 'Europe/Bucharest'} onChange={e => setK('timezone', e.target.value)} />
              <TextInput label="Format dată" value={settings.date_format || 'DD.MM.YYYY'} onChange={e => setK('date_format', e.target.value)} />
            </Stack>
          </Paper>
        </Tabs.Panel>

        <Tabs.Panel value="email" pt="md">
          <Paper withBorder p="md">
            <Stack>
              <TextInput label="SMTP Host" value={settings.smtp_host || ''} onChange={e => setK('smtp_host', e.target.value)} />
              <TextInput label="SMTP Port" value={settings.smtp_port || ''} onChange={e => setK('smtp_port', e.target.value)} />
              <TextInput label="Utilizator SMTP" value={settings.smtp_user || ''} onChange={e => setK('smtp_user', e.target.value)} />
              <PasswordInput label="Parolă SMTP" value={settings.smtp_pass || ''} onChange={e => setK('smtp_pass', e.target.value)} />
              <TextInput label="Expeditor implicit" value={settings.smtp_from || ''} onChange={e => setK('smtp_from', e.target.value)} />
              <TextInput label="Nume expeditor" value={settings.smtp_from_name || ''} onChange={e => setK('smtp_from_name', e.target.value)} />
            </Stack>
          </Paper>
        </Tabs.Panel>

        <Tabs.Panel value="notifications" pt="md">
          <Paper withBorder p="md">
            <Stack>
              <Switch label="Cereri noi" checked={settings.notify_new_request !== 'false'} onChange={e => setK('notify_new_request', String(e.currentTarget.checked))} />
              <Switch label="Documente aprobate" checked={settings.notify_doc_approved !== 'false'} onChange={e => setK('notify_doc_approved', String(e.currentTarget.checked))} />
              <Switch label="Documente respinse" checked={settings.notify_doc_rejected !== 'false'} onChange={e => setK('notify_doc_rejected', String(e.currentTarget.checked))} />
              <Switch label="Expirare termene" checked={settings.notify_deadline !== 'false'} onChange={e => setK('notify_deadline', String(e.currentTarget.checked))} />
            </Stack>
          </Paper>
        </Tabs.Panel>
      </Tabs>
      <Group justify="flex-end" mt="md"><Button onClick={save} loading={loading}>Salvează setările</Button></Group>
    </div>
  );
}
'use client';

import { useState, useEffect } from 'react';
import { Title, Paper, Grid, TextInput, Button, Alert, Stack, Group, Text, Box, Textarea } from '@mantine/core';
import { IconCheck, IconAlertCircle, IconBuilding } from '@tabler/icons-react';
import apiClient from '@/services/api';
import { motion } from 'framer-motion';

export default function CompanyPage() {
  const [form, setForm] = useState<Record<string, string>>({});
  const [msg, setMsg] = useState('');
  const [loading, setLoading] = useState(false);
  const [loadingData, setLoadingData] = useState(true);

  useEffect(() => {
    apiClient.get('/api/v1/company').then(r => {
      if (r.data.data) setForm(r.data.data);
    }).catch(() => {}).finally(() => setLoadingData(false));
  }, []);

  async function save() {
    setLoading(true); setMsg('');
    try {
      await apiClient.put('/api/v1/company', form);
      setMsg('Companie actualizată cu succes.');
    } catch (e: any) { setMsg(e.response?.data?.error || 'Eroare.'); }
    finally { setLoading(false); }
  }

  if (loadingData) {
    return <div className="page-container"><Text c="dimmed">Se încarcă...</Text></div>;
  }

  return (
    <div className="page-container animate-fade-in">
      <Box mb="xl">
        <Text size="xs" tt="uppercase" fw={600} c="dimmed" mb={4}>Administrare</Text>
        <Title order={3} fw={700}>Configurare companie</Title>
        <Text c="dimmed" size="sm">Datele și setările organizației</Text>
      </Box>

      {msg && (
        <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }}>
          <Alert icon={msg.includes('succes') ? <IconCheck size={16} /> : <IconAlertCircle size={16} />}
            color={msg.includes('succes') ? 'green' : 'red'} mb="md" styles={{ root: { borderRadius: 'var(--arcdoc-radius-md)' } }}>
            {msg}
          </Alert>
        </motion.div>
      )}

      <Paper p="lg" radius="lg" withBorder>
        <Stack>
          <Grid>
            <Grid.Col span={{ base: 12, md: 6 }}>
              <TextInput label="Denumire companie" value={form.name || ''} onChange={e => setForm({...form, name: e.target.value})} />
            </Grid.Col>
            <Grid.Col span={{ base: 12, md: 6 }}>
              <TextInput label="CUI" value={form.cui || ''} onChange={e => setForm({...form, cui: e.target.value})} />
            </Grid.Col>
            <Grid.Col span={{ base: 12, md: 6 }}>
              <TextInput label="Registrul Comerțului" value={form.reg_com || ''} onChange={e => setForm({...form, reg_com: e.target.value})} />
            </Grid.Col>
            <Grid.Col span={{ base: 12, md: 6 }}>
              <TextInput label="Website" value={form.website || ''} onChange={e => setForm({...form, website: e.target.value})} />
            </Grid.Col>
            <Grid.Col span={12}>
              <TextInput label="Adresă" value={form.address || ''} onChange={e => setForm({...form, address: e.target.value})} />
            </Grid.Col>
            <Grid.Col span={{ base: 12, md: 4 }}>
              <TextInput label="Județ" value={form.county || ''} onChange={e => setForm({...form, county: e.target.value})} />
            </Grid.Col>
            <Grid.Col span={{ base: 12, md: 4 }}>
              <TextInput label="Localitate" value={form.city || ''} onChange={e => setForm({...form, city: e.target.value})} />
            </Grid.Col>
            <Grid.Col span={{ base: 12, md: 4 }}>
              <TextInput label="Cod poștal" value={form.postal_code || ''} onChange={e => setForm({...form, postal_code: e.target.value})} />
            </Grid.Col>
            <Grid.Col span={{ base: 12, md: 6 }}>
              <TextInput label="Telefon" value={form.phone || ''} onChange={e => setForm({...form, phone: e.target.value})} />
            </Grid.Col>
            <Grid.Col span={{ base: 12, md: 6 }}>
              <TextInput label="Email" value={form.email || ''} onChange={e => setForm({...form, email: e.target.value})} />
            </Grid.Col>
            <Grid.Col span={{ base: 12, md: 6 }}>
              <TextInput label="Persoană de contact" value={form.contact_person || ''} onChange={e => setForm({...form, contact_person: e.target.value})} />
            </Grid.Col>
            <Grid.Col span={{ base: 12, md: 6 }}>
              <TextInput label="Funcție contact" value={form.contact_position || ''} onChange={e => setForm({...form, contact_position: e.target.value})} />
            </Grid.Col>
          </Grid>
          <Group justify="flex-end" mt="md">
            <Button onClick={save} loading={loading}>Salvează modificările</Button>
          </Group>
        </Stack>
      </Paper>
    </div>
  );
}

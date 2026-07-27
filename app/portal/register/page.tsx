'use client';
import { useState } from 'react';
import { Container, Title, Paper, TextInput, PasswordInput, Button, Alert } from '@mantine/core';
import { IconCheck } from '@tabler/icons-react';
import apiClient from '@/services/api';

export default function RegisterPage() {
  const [form, setForm] = useState({ email: '', password: '', firstName: '', lastName: '' });
  const [msg, setMsg] = useState('');
  const [saving, setSaving] = useState(false);

  async function register() {
    setSaving(true); setMsg('');
    try {
      await apiClient.post('/api/v1/auth/register', form);
      setMsg('Cont creat cu succes. Verificați email-ul pentru confirmare.');
    } catch (e: any) { setMsg(e.response?.data?.error || 'Eroare la înregistrare.'); }
    finally { setSaving(false); }
  }

  return (
    <Container size="xs" my="xl">
      <Title order={3} mb="lg" ta="center">Înregistrare Solicitant</Title>
      <Paper withBorder p="md" radius="md">
        {msg && <Alert icon={<IconCheck size={16}/>} color={msg.includes('succes')?'green':'red'} mb="md">{msg}</Alert>}
        <TextInput label="Prenume" value={form.firstName} onChange={e=>setForm({...form,firstName:e.target.value})} mb="sm" />
        <TextInput label="Nume" value={form.lastName} onChange={e=>setForm({...form,lastName:e.target.value})} mb="sm" />
        <TextInput label="Email" value={form.email} onChange={e=>setForm({...form,email:e.target.value})} mb="sm" />
        <PasswordInput label="Parolă" value={form.password} onChange={e=>setForm({...form,password:e.target.value})} mb="md" />
        <Button fullWidth onClick={register} loading={saving}>Înregistrare</Button>
      </Paper>
    </Container>
  );
}
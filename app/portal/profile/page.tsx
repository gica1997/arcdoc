'use client';
import { useState } from 'react';
import { Container, Title, Paper, TextInput, Button, Alert } from '@mantine/core';
import { IconCheck } from '@tabler/icons-react';
import { useAuth } from '@/hooks/useAuth';
import apiClient from '@/services/api';

export default function PortalProfilePage() {
  const { user, updateUser } = useAuth();
  const [fName, setFName] = useState(user?.firstName || '');
  const [lName, setLName] = useState(user?.lastName || '');
  const [phone, setPhone] = useState('');
  const [msg, setMsg] = useState('');
  const [saving, setSaving] = useState(false);

  async function save() {
    setSaving(true); setMsg('');
    try {
      await apiClient.put(`/api/v1/users/${user?.id}`, { firstName: fName, lastName: lName, phone });
      updateUser({ ...user!, firstName: fName, lastName: lName });
      setMsg('Profil actualizat cu succes.');
    } catch (e: any) { setMsg(e.response?.data?.error || 'Eroare.'); }
    finally { setSaving(false); }
  }

  return (
    <Container size="xs" my="xl">
      <Title order={3} mb="lg" ta="center">Portal Solicitant</Title>
      <Paper withBorder p="md" radius="md">
        {msg && <Alert icon={<IconCheck size={16}/>} color="green" mb="md">{msg}</Alert>}
        <TextInput label="Prenume" value={fName} onChange={e => setFName(e.target.value)} mb="sm" />
        <TextInput label="Nume" value={lName} onChange={e => setLName(e.target.value)} mb="sm" />
        <TextInput label="Email" value={user?.email || ''} disabled mb="sm" />
        <TextInput label="Telefon" value={phone} onChange={e => setPhone(e.target.value)} mb="md" />
        <Button fullWidth onClick={save} loading={saving}>Salvează</Button>
      </Paper>
    </Container>
  );
}
'use client';
import { useState, useEffect } from 'react';
import { Title, Table, Button, Group, TextInput, Badge, ActionIcon, Modal, Stack, Alert, Select, Textarea, Switch } from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import { IconPlus, IconEdit, IconTrash, IconSearch } from '@tabler/icons-react';
import apiClient, { handleApiError } from '@/services/api';
const TRIGGERS = [{value:'document_expiry',label:'Documentul expiră'},{value:'request_approved',label:'Cerere aprobată'},{value:'request_rejected',label:'Cerere respinsă'},{value:'new_document',label:'Document nou'}];
const ACTIONS = [{value:'send_notification',label:'Trimite notificare'},{value:'generate_pdf',label:'Generează PDF'},{value:'send_email',label:'Trimite email'},{value:'update_status',label:'Actualizează status'}];

export default function AutomationsPage() {
  const [items, setItems] = useState<any[]>([]);
  const [search, setSearch] = useState('');
  const [opened, { open, close }] = useDisclosure(false);
  const [editing, setEditing] = useState<any>(null);
  const [form, setForm] = useState({ name: '', description: '', trigger_type: 'document_expiry', action_type: 'send_notification', is_active: true });
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  async function fetch() { try { const r = await apiClient.get('/api/v1/automation'); setItems(r.data.data || []); } catch { } }
  useEffect(() => { fetch(); }, []);

  function openNew() { setEditing(null); setForm({ name: '', description: '', trigger_type: 'document_expiry', action_type: 'send_notification', is_active: true }); setError(''); open(); }
  function openEdit(it: any) { setEditing(it); setForm({ name: it.name, description: it.description||'', trigger_type: it.trigger_type, action_type: it.action_type, is_active: it.is_active }); setError(''); open(); }

  async function save() {
    setError(''); setSaving(true);
    try {
      if (editing) { await apiClient.put(`/api/v1/automation/${editing.id}`, form); }
      else { await apiClient.post('/api/v1/automation', form); }
      close(); fetch();
    } catch (err) { setError(handleApiError(err)); } finally { setSaving(false); }
  }

  const filtered = search ? items.filter(i => i.name.toLowerCase().includes(search.toLowerCase())) : items;

  return (
    <div className="page-container">
      <Group justify="space-between" mb="md"><Title order={3}>Automatizări</Title><Button leftSection={<IconPlus size={16} />} onClick={openNew}>Adaugă</Button></Group>
      <TextInput placeholder="Caută..." leftSection={<IconSearch size={14} />} value={search} onChange={e=>setSearch(e.target.value)} mb="md" />
      <Table><Table.Thead><Table.Tr><Table.Th>Nume</Table.Th><Table.Th>Trigger</Table.Th><Table.Th>Acțiune</Table.Th><Table.Th>Activă</Table.Th></Table.Tr></Table.Thead>
      <Table.Tbody>{filtered.map(it=>(
        <Table.Tr key={it.id}><Table.Td fw={500}>{it.name}</Table.Td><Table.Td><Badge color="blue">{TRIGGERS.find(t=>t.value===it.trigger_type)?.label||it.trigger_type}</Badge></Table.Td><Table.Td><Badge color="green">{ACTIONS.find(a=>a.value===it.action_type)?.label||it.action_type}</Badge></Table.Td><Table.Td><Badge color={it.is_active?'green':'gray'}>{it.is_active?'Da':'Nu'}</Badge></Table.Td></Table.Tr>
      ))}</Table.Tbody></Table>
      <Modal opened={opened} onClose={close} title={editing?'Editează':'Automatizare nouă'}>
        {error&&<Alert color="red" mb="md">{error}</Alert>}
        <Stack>
          <TextInput label="Nume" value={form.name} onChange={e=>setForm({...form,name:e.target.value})} required />
          <Select label="Declanșator" data={TRIGGERS} value={form.trigger_type} onChange={v=>setForm({...form,trigger_type:v||'document_expiry'})} />
          <Select label="Acțiune" data={ACTIONS} value={form.action_type} onChange={v=>setForm({...form,action_type:v||'send_notification'})} />
          <Switch label="Activă" checked={form.is_active} onChange={e=>setForm({...form,is_active:e.currentTarget.checked})} />
          <Group justify="flex-end"><Button variant="outline" onClick={close}>Anulează</Button><Button onClick={save} loading={saving}>Salvează</Button></Group>
        </Stack>
      </Modal>
    </div>
  );
}
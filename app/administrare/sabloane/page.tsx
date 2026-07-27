'use client';
import { useState, useEffect } from 'react';
import { Title, Table, Button, Group, TextInput, Select, Badge, ActionIcon, Modal, Stack, Alert, Textarea, MultiSelect } from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import { IconPlus, IconEdit, IconTrash, IconSearch } from '@tabler/icons-react';
import apiClient, { handleApiError } from '@/services/api';

const TYPES = [
  { value: 'pdf', label: 'PDF' }, { value: 'word', label: 'Word' }, { value: 'excel', label: 'Excel' }, { value: 'email', label: 'Email' },
];

export default function TemplatesPage() {
  const [items, setItems] = useState<any[]>([]);
  const [search, setSearch] = useState('');
  const [opened, { open, close }] = useDisclosure(false);
  const [editing, setEditing] = useState<any>(null);
  const [form, setForm] = useState({ name: '', slug: '', template_type: 'pdf', content: '', variables: [] as string[] });
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  async function fetch() { try { const r = await apiClient.get('/api/v1/templates'); setItems(r.data.data || []); } catch { } }
  useEffect(() => { fetch(); }, []);

  function openNew() { setEditing(null); setForm({ name: '', slug: '', template_type: 'pdf', content: '', variables: [] }); setError(''); open(); }
  function openEdit(it: any) { setEditing(it); setForm({ name: it.name, slug: it.slug, template_type: it.template_type, content: it.content||'', variables: (it.variables || []).map((v:any)=>typeof v==='string'?v:v.name) }); setError(''); open(); }

  async function save() {
    setError(''); setSaving(true);
    try {
      if (editing) { await apiClient.put(`/api/v1/templates/${editing.id}`, form); }
      else { await apiClient.post('/api/v1/templates', form); }
      close(); fetch();
    } catch (err) { setError(handleApiError(err)); } finally { setSaving(false); }
  }

  async function del(it: any) { if (!confirm('Ștergeți?')) return; try { await apiClient.delete(`/api/v1/templates/${it.id}`); fetch(); } catch { } }

  const filtered = search ? items.filter(i => i.name.toLowerCase().includes(search.toLowerCase())) : items;

  return (
    <div className="page-container">
      <Group justify="space-between" mb="md"><Title order={3}>Șabloane documente</Title><Button leftSection={<IconPlus size={16} />} onClick={openNew}>Adaugă</Button></Group>
      <TextInput placeholder="Caută..." leftSection={<IconSearch size={14} />} value={search} onChange={e=>setSearch(e.target.value)} mb="md" />
      <Table>
        <Table.Thead><Table.Tr><Table.Th>Nume</Table.Th><Table.Th>Slug</Table.Th><Table.Th>Tip</Table.Th><Table.Th>Variabile</Table.Th><Table.Th>Acțiuni</Table.Th></Table.Tr></Table.Thead>
        <Table.Tbody>{filtered.map(it=>(
          <Table.Tr key={it.id}><Table.Td fw={500}>{it.name}</Table.Td><Table.Td><Badge variant="light">{it.slug}</Badge></Table.Td><Table.Td><Badge color="blue">{TYPES.find(t=>t.value===it.template_type)?.label||it.template_type}</Badge></Table.Td><Table.Td>{(it.variables||[]).length || '0'} variabile</Table.Td>
            <Table.Td><Group gap={4}><ActionIcon variant="subtle" color="blue" onClick={()=>openEdit(it)}><IconEdit size={16}/></ActionIcon><ActionIcon variant="subtle" color="red" onClick={()=>del(it)}><IconTrash size={16}/></ActionIcon></Group></Table.Td>
          </Table.Tr>
        ))}</Table.Tbody>
      </Table>

      <Modal opened={opened} onClose={close} title={editing?'Editează':'Adaugă șablon'} size="lg">
        {error&&<Alert color="red" mb="md">{error}</Alert>}
        <Stack>
          <Group grow><TextInput label="Nume" value={form.name} onChange={e=>setForm({...form,name:e.target.value})} required /><TextInput label="Slug" value={form.slug} onChange={e=>setForm({...form,slug:e.target.value})} required /></Group>
          <Select label="Tip" data={TYPES} value={form.template_type} onChange={v=>setForm({...form,template_type:v||'pdf'})} />
          <Textarea label="Conținut șablon" value={form.content} onChange={e=>setForm({...form,content:e.target.value})} minRows={6} placeholder="Folosește {{variabila}} pentru variabile dinamice" />
          <MultiSelect label="Variabile disponibile" data={[]} searchable value={form.variables} onChange={(v:string[])=>setForm({...form,variables:v})} />
          <Group justify="flex-end"><Button variant="outline" onClick={close}>Anulează</Button><Button onClick={save} loading={saving}>{editing?'Salvează':'Creează'}</Button></Group>
        </Stack>
      </Modal>
    </div>
  );
}
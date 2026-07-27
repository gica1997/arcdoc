// ============================================
// ArcDoc Enterprise - Portal Solicitant Layout
// ============================================

'use client';

import React, { useState, useEffect, useCallback } from 'react';
import {
  AppShell, Burger, Group, Title, Text, NavLink, ScrollArea, ActionIcon, Tooltip,
  useMantineColorScheme, Box, Divider, Avatar, Menu, UnstyledButton, Badge, rem,
} from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import {
  IconDashboard, IconSend, IconFileText, IconBell, IconUser, IconSettings,
  IconLogout, IconSun, IconMoon, IconArchive, IconHistory, IconShield,
  IconChecklist, IconLock, IconFileReport, IconClock, IconAlertTriangle,
} from '@tabler/icons-react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { usePermissions } from '@/hooks/usePermissions';
import apiClient from '@/services/api';

const navItems = [
  { label: 'Dashboard', icon: IconDashboard, path: '/portal/dashboard' },
  { label: 'Solicitări', icon: IconSend, path: '/portal/requests' },
  { label: 'Documentele Mele', icon: IconFileText, path: '/portal/documents' },
  { label: 'Notificări', icon: IconBell, path: '/portal/notifications' },
  { label: 'Profil', icon: IconUser, path: '/portal/profile' },
  { label: 'Securitate', icon: IconShield, path: '/portal/security' },
];

function UserMenu() {
  const { user, logout } = useAuth();
  const { colorScheme, toggleColorScheme } = useMantineColorScheme();
  const isDark = colorScheme === 'dark';
  const router = useRouter();

  if (!user) return null;

  const initials = `${user.firstName?.[0] || ''}${user.lastName?.[0] || ''}`;

  return (
    <Group gap="xs">
      <Tooltip label={isDark ? 'Mod Luminos' : 'Mod Întunecat'}>
        <ActionIcon variant="subtle" color="gray" size="lg" onClick={toggleColorScheme}>
          {isDark ? <IconSun size={20} /> : <IconMoon size={20} />}
        </ActionIcon>
      </Tooltip>

      <Menu shadow="md" width={240} position="bottom-end">
        <Menu.Target>
          <UnstyledButton>
            <Group gap="xs">
              <Avatar color="blue" radius="xl" size="sm">{initials}</Avatar>
              <Box visibleFrom="sm">
                <Text size="sm" fw={500}>{user.firstName} {user.lastName}</Text>
                <Text size="xs" c="dimmed">{user.email}</Text>
              </Box>
            </Group>
          </UnstyledButton>
        </Menu.Target>

        <Menu.Dropdown>
          <Menu.Item leftSection={<IconUser size={14} />} component={Link} href="/portal/profile">Profil</Menu.Item>
          <Menu.Item leftSection={<IconShield size={14} />} component={Link} href="/portal/security">Securitate</Menu.Item>
          <Menu.Item leftSection={<IconBell size={14} />} component={Link} href="/portal/notifications">Notificări</Menu.Item>
          <Menu.Divider />
          <Menu.Item leftSection={<IconLogout size={14} />} color="red" onClick={() => { logout(); router.push('/login'); }}>
            Deconectare
          </Menu.Item>
        </Menu.Dropdown>
      </Menu>
    </Group>
  );
}

function NotificationBell() {
  const [count, setCount] = useState(0);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [opened, { toggle, close }] = useDisclosure(false);

  const fetch = useCallback(async () => {
    try {
      const r = await apiClient.get('/api/v1/notifications');
      const list = r.data.data || [];
      setNotifications(list);
      setCount(list.filter((n: any) => !n.is_read).length);
    } catch {}
  }, []);

  useEffect(() => { fetch(); const iv = setInterval(fetch, 15000); return () => clearInterval(iv); }, [fetch]);

  return (
    <Menu shadow="md" width={360} position="bottom-end" opened={opened} onClose={close} onOpen={toggle}>
      <Menu.Target>
        <ActionIcon variant="subtle" color="gray" size="lg" pos="relative">
          <IconBell size={20} />
          {count > 0 && (
            <Badge size="xs" circle color="red" style={{ position: 'absolute', top: -2, right: -2 }}>
              {count > 9 ? '9+' : count}
            </Badge>
          )}
        </ActionIcon>
      </Menu.Target>
      <Menu.Dropdown>
        <Group justify="space-between" px="md" py="xs">
          <Text fw={600} size="sm">Notificări</Text>
          <Button variant="subtle" size="xs" onClick={async () => { await apiClient.put('/api/v1/notifications'); fetch(); }}>
            Marchează citite
          </Button>
        </Group>
        <Divider />
        <ScrollArea h={320}>
          {notifications.length === 0 ? (
            <Text ta="center" py="xl" c="dimmed" size="sm">Nu ai notificări noi.</Text>
          ) : (
            notifications.slice(0, 20).map((n: any) => (
              <Menu.Item key={n.id} onClick={async () => { await apiClient.put(`/api/v1/notifications/${n.id}`); close(); if (n.link) window.location.href = n.link; }}>
                <Group gap="sm" wrap="nowrap">
                  <Box>
                    <Text size="sm" fw={n.is_read ? 400 : 600} lineClamp={2}>{n.title}</Text>
                    <Text size="xs" c="dimmed" lineClamp={1}>{n.body}</Text>
                    <Text size="xs" c="gray.5">{n.created_at ? new Date(n.created_at).toLocaleString('ro') : ''}</Text>
                  </Box>
                </Group>
              </Menu.Item>
            ))
          )}
        </ScrollArea>
        <Divider />
        <Menu.Item component={Link} href="/portal/notifications">
          <Text ta="center" size="sm" fw={500}>Vezi toate notificările</Text>
        </Menu.Item>
      </Menu.Dropdown>
    </Menu>
  );
}

interface PortalLayoutProps {
  children: React.ReactNode;
}

export default function PortalLayout({ children }: PortalLayoutProps) {
  const [opened, { toggle }] = useDisclosure(false);
  const { isAuthenticated, isLoading, user } = useAuth();
  const { hasRole } = usePermissions();
  const pathname = usePathname();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push('/login');
    }
  }, [isLoading, isAuthenticated, router]);

  if (isLoading) {
    return (
      <Box style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh' }}>
        <Text size="lg" c="dimmed">Se încarcă...</Text>
      </Box>
    );
  }

  if (!isAuthenticated) {
    return <>{children}</>;
  }

  return (
    <AppShell
      header={{ height: 60 }}
      navbar={{ width: 260, breakpoint: 'sm', collapsed: { mobile: !opened } }}
      padding={0}
      styles={{
        main: {
          background: 'var(--mantine-color-gray-0)',
          minHeight: '100vh',
        },
      }}
    >
      {/* Header Portal */}
      <AppShell.Header>
        <Group h="100%" px="md" justify="space-between">
          <Group>
            <Burger opened={opened} onClick={toggle} hiddenFrom="sm" size="sm" />
            <IconArchive size={26} color="var(--mantine-color-blue-6)" />
            <Title order={4} visibleFrom="sm">Portal Solicitant</Title>
          </Group>
          <Group>
            <NotificationBell />
            <UserMenu />
          </Group>
        </Group>
      </AppShell.Header>

      {/* Sidebar Portal */}
      <AppShell.Navbar p="xs" style={{ background: 'var(--mantine-color-gray-1)' }}>
        <AppShell.Section grow component={ScrollArea}>
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.path || (item.path !== '/portal/dashboard' && pathname.startsWith(item.path));
            return (
              <NavLink
                key={item.path}
                label={item.label}
                leftSection={<Icon size={18} />}
                component={Link}
                href={item.path}
                active={isActive}
                variant={isActive ? 'filled' : 'light'}
                mb={2}
                styles={{
                  root: {
                    borderRadius: 'var(--mantine-radius-md)',
                  },
                }}
              />
            );
          })}
        </AppShell.Section>
        <AppShell.Section>
          <Divider my="xs" />
          <Group px="md" py="xs" gap="xs">
            <Avatar color="blue" radius="xl" size="sm">
              {user?.firstName?.[0]}{user?.lastName?.[0]}
            </Avatar>
            <Box style={{ flex: 1 }}>
              <Text size="sm" fw={500} lineClamp={1}>{user?.firstName} {user?.lastName}</Text>
              <Text size="xs" c="dimmed" lineClamp={1}>Solicitant</Text>
            </Box>
          </Group>
          <Text size="xs" c="dimmed" ta="center" py="xs">&copy; {new Date().getFullYear()} ArcDoc Enterprise</Text>
        </AppShell.Section>
      </AppShell.Navbar>

      {/* Main Content */}
      <AppShell.Main>
        {children}
      </AppShell.Main>
    </AppShell>
  );
}

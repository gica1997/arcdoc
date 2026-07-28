// ============================================
// ArcDoc Enterprise 2026 — Premium App Layout
// ============================================

'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  AppShell, Group, Title, ScrollArea, ActionIcon, Tooltip, Text, Box, Divider,
  Avatar, Menu, UnstyledButton, Badge, Button, TextInput, Kbd,
} from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import { useMantineColorScheme } from '@mantine/core';
import {
  IconArchive, IconSearch, IconSun, IconMoon, IconLogout, IconUser, IconSettings,
  IconBell, IconChevronDown, IconLayoutSidebarLeftCollapse, IconLayoutSidebarLeftExpand,
  IconHelp, IconCommand, IconDashboard, IconUsers, IconBuilding, IconSend, IconReport,
  IconHistory, IconFolders, IconList, IconUserShield, IconLock,
  IconFileTypeTs, IconTags, IconHierarchy, IconUsersGroup, IconMapPin,
  IconListTree, IconBooks, IconCalendarTime, IconTruck, IconFileDownload,
  IconBoxMultiple, IconBook, IconPlus, IconEye, IconAdjustments,
} from '@tabler/icons-react';
import type { TablerIcon } from '@tabler/icons-react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { usePermissions } from '@/hooks/usePermissions';
import { sidebarConfig, filterSidebarByPermissions } from '@/lib/sidebar.config';
import type { SidebarItem } from '@/types';
import { motion, AnimatePresence } from 'framer-motion';

// ─── Command Palette ────────────────────────
function CommandPalette({ opened, onClose }: { opened: boolean; onClose: () => void }) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<{ label: string; path: string; icon: React.ReactNode; group: string }[]>([]);
  const router = useRouter();
  const pathname = usePathname();

  const iconMap: Record<string, React.ReactNode> = {
    IconDashboard: <IconDashboard size={18} />,
    IconUsers: <IconUsers size={18} />,
    IconBuilding: <IconBuilding size={18} />,
    IconArchive: <IconArchive size={18} />,
    IconSend: <IconSend size={18} />,
    IconReport: <IconReport size={18} />,
    IconHistory: <IconHistory size={18} />,
    IconSettings: <IconSettings size={18} />,
    IconUserShield: <IconUserShield size={18} />,
    IconLock: <IconLock size={18} />,
    IconList: <IconList size={18} />,
    IconFolders: <IconFolders size={18} />,
    IconFileTypeTs: <IconFileTypeTs size={18} />,
    IconTags: <IconTags size={18} />,
    IconHierarchy: <IconHierarchy size={18} />,
    IconUsersGroup: <IconUsersGroup size={18} />,
    IconMapPin: <IconMapPin size={18} />,
    IconListTree: <IconListTree size={18} />,
    IconBooks: <IconBooks size={18} />,
    IconCalendarTime: <IconCalendarTime size={18} />,
    IconTruck: <IconTruck size={18} />,
    IconFileDownload: <IconFileDownload size={18} />,
    IconBoxMultiple: <IconBoxMultiple size={18} />,
    IconBook: <IconBook size={18} />,
    IconPlus: <IconPlus size={18} />,
    IconEye: <IconEye size={18} />,
    IconAdjustments: <IconAdjustments size={18} />,
  };

  const allItems = useMemo(() => {
    const items: { label: string; path: string; icon: React.ReactNode; group: string }[] = [];
    const addItem = (item: SidebarItem, group: string) => {
      if (item.path) {
        items.push({
          label: item.label,
          path: item.path,
          icon: iconMap[item.icon] || <IconList size={18} />,
          group,
        });
      }
      if (item.children) item.children.forEach(c => addItem(c, group));
    };
    sidebarConfig.forEach(item => addItem(item, item.module || 'general'));
    return items;
  }, []);

  useEffect(() => {
    if (!query) { setResults([]); return; }
    const q = query.toLowerCase();
    setResults(
      allItems.filter(i =>
        i.label.toLowerCase().includes(q) || i.path.toLowerCase().includes(q)
      ).slice(0, 8)
    );
  }, [query, allItems]);

  useEffect(() => {
    if (!opened) { setQuery(''); setResults([]); }
  }, [opened]);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        if (opened) onClose(); else { setQuery(''); onClose(); }
      }
      if (opened && e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [opened, onClose]);

  if (!opened) return null;

  return (
    <AnimatePresence>
      {opened && (
        <>
          <motion.div
            className="command-overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
          />
          <motion.div
            className="command-palette"
            initial={{ opacity: 0, y: -20, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.96 }}
            transition={{ duration: 0.15, ease: 'easeOut' }}
          >
            <Box
              style={{
                background: 'var(--arcdoc-glass-bg)',
                backdropFilter: 'var(--arcdoc-glass-blur)',
                WebkitBackdropFilter: 'var(--arcdoc-glass-blur)',
                border: 'var(--arcdoc-glass-border)',
                borderRadius: 'var(--arcdoc-radius-xl)',
                boxShadow: '0 25px 60px rgba(0,0,0,0.15)',
                overflow: 'hidden',
              }}
            >
              <Box p="md" style={{ borderBottom: '1px solid var(--arcdoc-border)' }}>
                <TextInput
                  placeholder="Caută pagini, documente, utilizatori..."
                  value={query}
                  onChange={e => setQuery(e.currentTarget.value)}
                  leftSection={<IconSearch size={18} />}
                  rightSection={<Kbd>ESC</Kbd>}
                  size="lg"
                  variant="unstyled"
                  styles={{
                    input: {
                      fontSize: '1rem',
                      background: 'transparent',
                      border: 'none',
                      '&:focus': { outline: 'none', boxShadow: 'none' },
                    },
                  }}
                  autoFocus
                />
              </Box>
              <ScrollArea h={320}>
                {results.length === 0 && query && (
                  <Box p="xl" ta="center">
                    <Text c="dimmed">Niciun rezultat pentru "{query}"</Text>
                  </Box>
                )}
                {results.length === 0 && !query && (
                  <Box p="xl">
                    <Text size="xs" c="dimmed" tt="uppercase" fw={600} mb="sm">Sugestii rapide</Text>
                    <Group gap="xs" mb="xs">
                      <Button variant="light" size="sm" onClick={() => { router.push('/dashboard'); onClose(); }}>Dashboard</Button>
                      <Button variant="light" size="sm" onClick={() => { router.push('/solicitari'); onClose(); }}>Solicitări</Button>
                      <Button variant="light" size="sm" onClick={() => { router.push('/arhiva/documente'); onClose(); }}>Documente</Button>
                      <Button variant="light" size="sm" onClick={() => { router.push('/utilizatori'); onClose(); }}>Utilizatori</Button>
                    </Group>
                    <Text size="xs" c="dimmed" mt="lg">
                      Apasă <Kbd>↑</Kbd><Kbd>↓</Kbd> pentru navigare, <Kbd>Enter</Kbd> pentru a deschide
                    </Text>
                  </Box>
                )}
                {results.map((r, i) => (
                  <UnstyledButton
                    key={r.path + i}
                    style={{
                      display: 'flex', alignItems: 'center', gap: '0.75rem',
                      padding: '0.625rem 1rem', width: '100%',
                      transition: 'background 0.1s',
                      cursor: 'pointer',
                    }}
                    onMouseEnter={e => (e.currentTarget.style.background = 'var(--arcdoc-surface-hover)')}
                    onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                    onClick={() => { router.push(r.path); onClose(); }}
                  >
                    <Text size="sm" c="dimmed" style={{ flex: 1 }}>{r.label}</Text>
                    <Text size="xs" c="dimmed">{r.group}</Text>
                  </UnstyledButton>
                ))}
              </ScrollArea>
              <Box
                p="xs"
                style={{
                  borderTop: '1px solid var(--arcdoc-border)',
                  background: 'var(--arcdoc-surface-hover)',
                  display: 'flex', gap: '1rem', fontSize: '0.75rem', color: 'var(--arcdoc-text-tertiary)',
                }}
              >
                <Group gap={4}><Kbd>↵</Kbd> Open</Group>
                <Group gap={4}><Kbd>⌘K</Kbd> Toggle</Group>
                <Group gap={4}><Kbd>Esc</Kbd> Close</Group>
              </Box>
            </Box>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

// ─── Sidebar Navigation ─────────────────────
function SidebarNav({ collapsed, onNavigate }: { collapsed: boolean; onNavigate?: () => void }) {
  const pathname = usePathname();
  const { user } = useAuth();
  const userPermissions = user?.permissions || [];
  const userRoles = user?.roles || [];
  const isAdmin = userRoles.includes('administrator');

  const effectivePermissions = isAdmin
    ? sidebarConfig.flatMap(item => [item.permissions || [], ...(item.children || []).map(c => c.permissions || [])]).flat().filter(Boolean) as string[]
    : userPermissions;

  const filteredItems = filterSidebarByPermissions(sidebarConfig, effectivePermissions);

  const sections = [
    { title: 'Principal', items: filteredItems.filter(i => ['dashboard'].includes(i.module || '')) },
    { title: 'Management', items: filteredItems.filter(i => ['users', 'organization', 'archive', 'requests'].includes(i.module || '')) },
    { title: 'Sistem', items: filteredItems.filter(i => ['reports', 'audit', 'settings'].includes(i.module || '')) },
  ];

  const iconMap: Record<string, React.ReactNode> = {
    IconDashboard: <IconDashboard size={20} />,
    IconUsers: <IconUsers size={20} />,
    IconBuilding: <IconBuilding size={20} />,
    IconArchive: <IconArchive size={20} />,
    IconSend: <IconSend size={20} />,
    IconReport: <IconReport size={20} />,
    IconHistory: <IconHistory size={20} />,
    IconSettings: <IconSettings size={20} />,
    IconUserShield: <IconUserShield size={20} />,
    IconLock: <IconLock size={20} />,
    IconList: <IconList size={20} />,
    IconFolders: <IconFolders size={20} />,
    IconFileTypeTs: <IconFileTypeTs size={20} />,
    IconTags: <IconTags size={20} />,
    IconHierarchy: <IconHierarchy size={20} />,
    IconUsersGroup: <IconUsersGroup size={20} />,
    IconMapPin: <IconMapPin size={20} />,
    IconListTree: <IconListTree size={20} />,
    IconBooks: <IconBooks size={20} />,
    IconCalendarTime: <IconCalendarTime size={20} />,
    IconTruck: <IconTruck size={20} />,
    IconFileDownload: <IconFileDownload size={20} />,
    IconBoxMultiple: <IconBoxMultiple size={20} />,
    IconBook: <IconBook size={20} />,
    IconPlus: <IconPlus size={20} />,
    IconEye: <IconEye size={20} />,
    IconAdjustments: <IconAdjustments size={20} />,
  };

  function getIcon(name: string, size = 20): React.ReactNode {
    return iconMap[name] || <IconList size={size} />;
  }

  function isActive(item: SidebarItem): boolean {
    if (item.path === pathname) return true;
    if (item.children) return item.children.some(c => c.path === pathname);
    return false;
  }

  function renderNavItem(item: SidebarItem, depth = 0) {
    const active = isActive(item);
    const hasChildren = item.children && item.children.length > 0;

    if (collapsed) {
      return (
        <Tooltip key={item.label} label={item.label} position="right" offset={10} withArrow>
          <Link
            href={item.path || '#'}
            className={`sidebar-link ${active ? 'active' : ''}`}
            style={{ justifyContent: 'center', padding: '0.5rem' }}
            onClick={onNavigate}
          >
            {getIcon(item.icon)}
          </Link>
        </Tooltip>
      );
    }

    return (
      <Box key={item.label} mb={2}>
        <Link
          href={item.path || '#'}
          className={`sidebar-link ${active ? 'active' : ''}`}
          onClick={onNavigate}
        >
          {getIcon(item.icon)}
          <Text size="sm" style={{ flex: 1 }}>{item.label}</Text>
          {hasChildren && <IconChevronDown size={14} style={{ transform: active ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }} />}
        </Link>
        {hasChildren && active && (
          <Box ml="lg" mt={2}>
            {item.children!.map(child => (
              <Link
                key={child.path || child.label}
                href={child.path || '#'}
                className={`sidebar-link ${child.path === pathname ? 'active' : ''}`}
                style={{ padding: '0.375rem 0.75rem', fontSize: '0.8125rem' }}
                onClick={onNavigate}
              >
                {getIcon(child.icon)}
                <Text size="xs">{child.label}</Text>
              </Link>
            ))}
          </Box>
        )}
      </Box>
    );
  }

  return (
    <>
      {sections.map(section => {
        const visibleItems = collapsed
          ? section.items
          : section.items.filter(i => i.children || i.path);
        if (visibleItems.length === 0) return null;
        return (
          <Box key={section.title} mb="xs">
            {!collapsed && (
              <div className="sidebar-section-title">{section.title}</div>
            )}
            {visibleItems.map(item => renderNavItem(item))}
          </Box>
        );
      })}
    </>
  );
}

// ─── User Menu ──────────────────────────────
function UserMenu() {
  const { user, logout } = useAuth();
  const { colorScheme, toggleColorScheme } = useMantineColorScheme();
  const isDark = colorScheme === 'dark';
  const router = useRouter();

  if (!user) return null;

  const initials = `${user.firstName?.[0] || ''}${user.lastName?.[0] || ''}`;

  return (
    <Group gap="xs">
      <Menu shadow="lg" width={280} position="bottom-end" offset={8}>
        <Menu.Target>
          <UnstyledButton
            style={{
              borderRadius: 'var(--arcdoc-radius-lg)',
              padding: '0.25rem 0.5rem',
              transition: 'background 0.15s',
            }}
            onMouseEnter={e => (e.currentTarget.style.background = 'var(--arcdoc-surface-hover)')}
            onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
          >
            <Group gap="xs">
              <Avatar
                color="arcdoc-primary"
                radius="xl"
                size="sm"
                style={{ border: '2px solid var(--arcdoc-primary-200)' }}
              >
                {initials}
              </Avatar>
              <Box visibleFrom="sm">
                <Text size="sm" fw={600} style={{ lineHeight: 1.2 }}>
                  {user.firstName} {user.lastName}
                </Text>
                <Text size="xs" c="dimmed" style={{ lineHeight: 1.2 }}>
                  {user.email}
                </Text>
              </Box>
            </Group>
          </UnstyledButton>
        </Menu.Target>

        <Menu.Dropdown
          style={{
            background: 'var(--arcdoc-glass-bg)',
            backdropFilter: 'var(--arcdoc-glass-blur)',
            WebkitBackdropFilter: 'var(--arcdoc-glass-blur)',
            border: 'var(--arcdoc-glass-border)',
          }}
        >
          <Menu.Label>Cont</Menu.Label>
          <Menu.Item leftSection={<IconUser size={16} />} component={Link} href="/profil">Profil</Menu.Item>
          <Menu.Item leftSection={<IconSettings size={16} />} component={Link} href="/administrare/setari">Setări</Menu.Item>
          <Menu.Divider />
          <Menu.Label>Preferințe</Menu.Label>
          <Menu.Item
            leftSection={isDark ? <IconSun size={16} /> : <IconMoon size={16} />}
            onClick={toggleColorScheme}
          >
            {isDark ? 'Mod Luminos' : 'Mod Întunecat'}
          </Menu.Item>
          <Menu.Divider />
          <Menu.Item
            leftSection={<IconLogout size={16} />}
            color="red"
            onClick={async () => { await logout(); router.push('/login'); }}
          >
            Deconectare
          </Menu.Item>
        </Menu.Dropdown>
      </Menu>
    </Group>
  );
}

// ─── Main Layout ────────────────────────────
interface AppLayoutProps {
  children: React.ReactNode;
}

export default function AppLayout({ children }: AppLayoutProps) {
  const [sidebarOpened, { toggle: toggleSidebar }] = useDisclosure(true);
  const [mobileOpened, { toggle: toggleMobile }] = useDisclosure(false);
  const [cmdOpen, setCmdOpen] = useState(false);
  const { isAuthenticated, isLoading } = useAuth();
  const { colorScheme } = useMantineColorScheme();
  const isDark = colorScheme === 'dark';
  const pathname = usePathname();
  const router = useRouter();

  const isAuthPage = pathname?.startsWith('/login') || pathname?.startsWith('/forgot-password') || pathname?.startsWith('/reset-password');
  const isPortal = pathname?.startsWith('/portal');

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setCmdOpen(prev => !prev);
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, []);

  useEffect(() => { setCmdOpen(false); }, [pathname]);

  if (isLoading) {
    return (
      <Box style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh', background: 'var(--arcdoc-bg)' }}>
        <Box ta="center">
          <IconArchive size={40} style={{ color: 'var(--arcdoc-primary-500)' }} />
          <Text size="sm" c="dimmed" mt="sm">Se încarcă...</Text>
        </Box>
      </Box>
    );
  }

  if (!isAuthenticated || isAuthPage || isPortal) {
    return <>{children}</>;
  }

  const collapsed = !sidebarOpened;

  return (
    <>
      <CommandPalette opened={cmdOpen} onClose={() => setCmdOpen(false)} />

      <AppShell
        header={{ height: { base: 56, md: 56 } }}
        navbar={{
          width: { base: collapsed ? 0 : 280, md: collapsed ? 68 : 280 },
          breakpoint: 'sm',
          collapsed: { mobile: !mobileOpened, desktop: false },
        }}
        padding={0}
        styles={{
          main: {
            background: 'var(--arcdoc-bg)',
            minHeight: '100vh',
            transition: 'padding-left 200ms cubic-bezier(0.4, 0, 0.2, 1)',
          },
          navbar: {
            background: 'var(--arcdoc-sidebar-bg)',
            borderRight: '1px solid var(--arcdoc-border)',
            transition: 'width 200ms cubic-bezier(0.4, 0, 0.2, 1)',
          },
          header: {
            background: 'var(--arcdoc-topbar-bg)',
            backdropFilter: 'var(--arcdoc-glass-blur)',
            WebkitBackdropFilter: 'var(--arcdoc-glass-blur)',
            borderBottom: '1px solid var(--arcdoc-border)',
          },
        }}
      >
        {/* ─── Topbar ─────────────────────── */}
        <AppShell.Header>
          <Group h="100%" px="md" justify="space-between" wrap="nowrap">
            <Group gap="xs" wrap="nowrap">
              <ActionIcon
                variant="subtle"
                color="gray"
                size="lg"
                onClick={() => {
                  if (window.innerWidth < 768) toggleMobile();
                  else toggleSidebar();
                }}
                hiddenFrom={collapsed ? 'md' : 'xs'}
              >
                {collapsed ? <IconLayoutSidebarLeftExpand size={20} /> : <IconLayoutSidebarLeftCollapse size={20} />}
              </ActionIcon>
              <Group gap={8} visibleFrom="xs">
                <IconArchive size={24} style={{ color: 'var(--arcdoc-primary-500)' }} />
                <Title order={5} style={{ background: 'var(--arcdoc-gradient)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                  ArcDoc
                </Title>
              </Group>
            </Group>

            <Group gap="lg">
              {/* Global Search */}
              <UnstyledButton
                onClick={() => setCmdOpen(true)}
                style={{
                  display: 'flex', alignItems: 'center', gap: '0.5rem',
                  padding: '0.375rem 0.75rem',
                  borderRadius: 'var(--arcdoc-radius-lg)',
                  background: 'var(--arcdoc-surface)',
                  border: '1px solid var(--arcdoc-border)',
                  minWidth: 240,
                  cursor: 'pointer',
                  transition: 'all 0.15s',
                }}
                onMouseEnter={e => (e.currentTarget.style.borderColor = 'var(--arcdoc-primary-300)')}
                onMouseLeave={e => (e.currentTarget.style.borderColor = 'var(--arcdoc-border)')}
              >
                <IconSearch size={16} style={{ color: 'var(--arcdoc-text-tertiary)' }} />
                <Text size="sm" c="dimmed" style={{ flex: 1 }}>Caută orice...</Text>
                <Group gap={4} style={{ flexShrink: 0 }}>
                  <Kbd style={{ fontSize: '0.625rem', padding: '0 0.25rem' }}>⌘</Kbd>
                  <Kbd style={{ fontSize: '0.625rem', padding: '0 0.25rem' }}>K</Kbd>
                </Group>
              </UnstyledButton>

              {/* Quick Actions */}
              <Tooltip label="Comenzi rapide (⌘K)">
                <ActionIcon variant="subtle" color="gray" size="lg" onClick={() => setCmdOpen(true)}>
                  <IconCommand size={20} />
                </ActionIcon>
              </Tooltip>

              {/* Help */}
              <Tooltip label="Ajutor">
                <ActionIcon variant="subtle" color="gray" size="lg">
                  <IconHelp size={20} />
                </ActionIcon>
              </Tooltip>

              {/* User Menu */}
              <UserMenu />
            </Group>
          </Group>
        </AppShell.Header>

        {/* ─── Sidebar ────────────────────── */}
        <AppShell.Navbar>
          <Box
            style={{
              display: 'flex', flexDirection: 'column',
              height: '100%',
            }}
          >
            {/* Logo area */}
            {collapsed ? (
              <Box ta="center" py="md">
                <IconArchive size={24} style={{ color: 'var(--arcdoc-primary-500)' }} />
              </Box>
            ) : (
              <Box px="md" py="md" style={{ borderBottom: '1px solid var(--arcdoc-border)' }}>
                <Group gap={10}>
                  <Box
                    style={{
                      width: 32, height: 32, borderRadius: 'var(--arcdoc-radius-md)',
                      background: 'var(--arcdoc-gradient)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                    }}
                  >
                    <IconArchive size={18} color="white" />
                  </Box>
                  <Box>
                    <Text fw={700} size="md" style={{ lineHeight: 1.2 }}>ArcDoc</Text>
                    <Text size="xs" c="dimmed" style={{ lineHeight: 1.2 }}>Enterprise Suite</Text>
                  </Box>
                </Group>
              </Box>
            )}

            {/* Navigation */}
            <ScrollArea style={{ flex: 1 }} px={collapsed ? 'xs' : 'sm'}>
              <SidebarNav collapsed={collapsed} onNavigate={() => { if (window.innerWidth < 768) toggleMobile(); }} />
            </ScrollArea>

            {/* Footer */}
            <Box
              p="xs"
              style={{
                borderTop: '1px solid var(--arcdoc-border)',
                background: 'var(--arcdoc-sidebar-bg)',
              }}
            >
              {!collapsed && (
                <Text size="xs" c="dimmed" ta="center">
                  &copy; {new Date().getFullYear()} ArcDoc
                </Text>
              )}
              <ActionIcon
                variant="subtle"
                color="gray"
                size="sm"
                onClick={toggleSidebar}
                style={{ display: 'block', margin: '0 auto' }}
                visibleFrom="md"
              >
                {collapsed ? <IconLayoutSidebarLeftExpand size={16} /> : <IconLayoutSidebarLeftCollapse size={16} />}
              </ActionIcon>
            </Box>
          </Box>
        </AppShell.Navbar>

        {/* ─── Main Content ───────────────── */}
        <AppShell.Main>
          <motion.div
            key={pathname}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.2, ease: 'easeOut' }}
          >
            {children}
          </motion.div>
        </AppShell.Main>
      </AppShell>
    </>
  );
}

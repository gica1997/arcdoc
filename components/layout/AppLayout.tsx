// ============================================
// ArcDoc Enterprise - Main Application Layout
// ============================================

'use client';

import React, { useState } from 'react';
import {
  AppShell,
  Burger,
  Group,
  Title,
  NavLink,
  ScrollArea,
  ActionIcon,
  Tooltip,
  useMantineColorScheme,
  Text,
  Box,
  Divider,
  Avatar,
  Menu,
  UnstyledButton,
  rem,
} from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import {
  IconDashboard,
  IconUsers,
  IconArchive,
  IconSend,
  IconSettings,
  IconHistory,
  IconReport,
  IconBuilding,
  IconUserShield,
  IconLock,
  IconFolders,
  IconFileStack,
  IconFileDots,
  IconFileText,
  IconList,
  IconPlus,
  IconEye,
  IconAdjustments,
  IconMail,
  IconBell,
  IconSun,
  IconMoon,
  IconLogout,
  IconUser,
  IconChevronRight,
  IconMenu2,
} from '@tabler/icons-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { usePermissions } from '@/hooks/usePermissions';
import { sidebarConfig, filterSidebarByPermissions } from '@/lib/sidebar.config';
import type { SidebarItem } from '@/types';

// ─── Icon Mapping ──────────────────────────

const iconMap: Record<string, React.ReactNode> = {
  IconDashboard: <IconDashboard size={20} />,
  IconUsers: <IconUsers size={20} />,
  IconArchive: <IconArchive size={20} />,
  IconSend: <IconSend size={20} />,
  IconSettings: <IconSettings size={20} />,
  IconHistory: <IconHistory size={20} />,
  IconReport: <IconReport size={20} />,
  IconBuilding: <IconBuilding size={20} />,
  IconUserShield: <IconUserShield size={20} />,
  IconLock: <IconLock size={20} />,
  IconFolders: <IconFolders size={20} />,
  IconFileStack: <IconFileStack size={20} />,
  IconFileDots: <IconFileDots size={20} />,
  IconFileText: <IconFileText size={20} />,
  IconList: <IconList size={20} />,
  IconPlus: <IconPlus size={20} />,
  IconEye: <IconEye size={20} />,
  IconAdjustments: <IconAdjustments size={20} />,
  IconMail: <IconMail size={20} />,
  IconBell: <IconBell size={20} />,
};

function getIcon(iconName: string): React.ReactNode {
  return iconMap[iconName] || <IconChevronRight size={20} />;
}

// ─── Sidebar Navigation ────────────────────

function SidebarNav() {
  const pathname = usePathname();
  const { user } = useAuth();
  const userPermissions = user?.permissions || [];
  const userRoles = user?.roles || [];
  const isAdmin = userRoles.includes('administrator');

  // Admin sees everything
  const effectivePermissions = isAdmin
    ? sidebarConfig.flatMap(item => [item.permissions || [], ...(item.children || []).map(c => c.permissions || [])]).flat().filter(Boolean) as string[]
    : userPermissions;

  const filteredItems = filterSidebarByPermissions(sidebarConfig, effectivePermissions);

  function renderNavItems(items: SidebarItem[]) {
    return items.map((item) => {
      if (item.children && item.children.length > 0) {
        return (
          <NavLink
            key={item.label}
            label={item.label}
            leftSection={getIcon(item.icon)}
            defaultOpened={item.children.some((child) => child.path === pathname)}
          >
            {renderNavItems(item.children)}
          </NavLink>
        );
      }

      return (
        <NavLink
          key={item.path || item.label}
          label={item.label}
          leftSection={getIcon(item.icon)}
          component={Link}
          href={item.path || '#'}
          active={item.path === pathname}
        />
      );
    });
  }

  return <>{renderNavItems(filteredItems)}</>;
}

// ─── User Menu ─────────────────────────────

function UserMenu() {
  const { user, logout } = useAuth();
  const { colorScheme, toggleColorScheme } = useMantineColorScheme();
  const isDark = colorScheme === 'dark';

  if (!user) return null;

  return (
    <Group gap="xs">
      <Tooltip label={isDark ? 'Light Mode' : 'Dark Mode'}>
        <ActionIcon
          variant="subtle"
          color="gray"
          size="lg"
          onClick={toggleColorScheme}
        >
          {isDark ? <IconSun size={20} /> : <IconMoon size={20} />}
        </ActionIcon>
      </Tooltip>

      <Menu shadow="md" width={200} position="bottom-end">
        <Menu.Target>
          <UnstyledButton>
            <Group gap="xs">
              <Avatar color="blue" radius="xl" size="sm">
                {user.firstName?.[0]}
                {user.lastName?.[0]}
              </Avatar>
              <Box visibleFrom="sm">
                <Text size="sm" fw={500}>
                  {user.firstName} {user.lastName}
                </Text>
                <Text size="xs" c="dimmed">
                  {user.email}
                </Text>
              </Box>
            </Group>
          </UnstyledButton>
        </Menu.Target>

        <Menu.Dropdown>
          <Menu.Item leftSection={<IconUser size={14} />} component={Link} href="/profil">
            Profil
          </Menu.Item>
          <Menu.Item leftSection={<IconSettings size={14} />} component={Link} href="/administrare/setari">
            Setări
          </Menu.Item>
          <Menu.Divider />
          <Menu.Item
            leftSection={<IconLogout size={14} />}
            color="red"
            onClick={logout}
          >
            Deconectare
          </Menu.Item>
        </Menu.Dropdown>
      </Menu>
    </Group>
  );
}

// ─── Main Layout Component ─────────────────

interface AppLayoutProps {
  children: React.ReactNode;
}

export default function AppLayout({ children }: AppLayoutProps) {
  const [opened, { toggle, close }] = useDisclosure(false);
  const { isAuthenticated, isLoading } = useAuth();

  // If still loading auth state, show loading
  if (isLoading) {
    return (
      <Box
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          height: '100vh',
        }}
      >
        <Text size="lg" c="dimmed">
          Se încarcă...
        </Text>
      </Box>
    );
  }

  // If not authenticated, show login page (handled by middleware)
  if (!isAuthenticated) {
    return <>{children}</>;
  }

  return (
    <AppShell
      header={{ height: 60 }}
      navbar={{
        width: 280,
        breakpoint: 'sm',
        collapsed: { mobile: !opened },
      }}
      padding="md"
    >
      {/* ─── Topbar ──────────────────────── */}
      <AppShell.Header>
        <Group h="100%" px="md" justify="space-between">
          <Group>
            <Burger
              opened={opened}
              onClick={toggle}
              hiddenFrom="sm"
              size="sm"
            />
            <IconArchive size={28} color="var(--mantine-color-blue-6)" />
            <Title order={4} visibleFrom="sm">
              ArcDoc Enterprise
            </Title>
          </Group>

          <UserMenu />
        </Group>
      </AppShell.Header>

      {/* ─── Sidebar ─────────────────────── */}
      <AppShell.Navbar p="xs">
        <AppShell.Section grow component={ScrollArea}>
          <SidebarNav />
        </AppShell.Section>

        <AppShell.Section>
          <Divider my="xs" />
          <Text size="xs" c="dimmed" ta="center" py="xs">
            &copy; {new Date().getFullYear()} ArcDoc
          </Text>
        </AppShell.Section>
      </AppShell.Navbar>

      {/* ─── Main Content ────────────────── */}
      <AppShell.Main>
        {children}
      </AppShell.Main>
    </AppShell>
  );
}
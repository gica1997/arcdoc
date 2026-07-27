// ============================================
// ArcDoc Enterprise - Sidebar Configuration
// ============================================

import type { SidebarItem } from '@/types';

export const sidebarConfig: SidebarItem[] = [
  {
    label: 'Dashboard', icon: 'IconDashboard', path: '/dashboard', module: 'dashboard', permissions: ['dashboard.view'],
  },
  {
    label: 'Utilizatori', icon: 'IconUsers', module: 'users', permissions: ['users.view'],
    children: [
      { label: 'Listă utilizatori', icon: 'IconList', path: '/utilizatori', permissions: ['users.view'] },
      { label: 'Roluri', icon: 'IconUserShield', path: '/utilizatori/roluri', permissions: ['roles.view'] },
      { label: 'Permisiuni', icon: 'IconLock', path: '/utilizatori/permisiuni', permissions: ['permissions.view'] },
    ],
  },
  {
    label: 'Administrare', icon: 'IconBuilding', module: 'organization', permissions: ['organization.view'],
    children: [
      { label: 'Companie', icon: 'IconBuilding', path: '/administrare/companie', permissions: ['settings.view'] },
      { label: 'Departamente', icon: 'IconHierarchy', path: '/administrare/departamente', permissions: ['organization.view'] },
      { label: 'Funcții', icon: 'IconUsersGroup', path: '/administrare/functii', permissions: ['organization.view'] },
      { label: 'Locații', icon: 'IconMapPin', path: '/administrare/locatii', permissions: ['organization.view'] },
      { label: 'Tipuri Documente', icon: 'IconFileType', path: '/administrare/tipuri-documente', permissions: ['documents.view'] },
      { label: 'Nomenclatoare', icon: 'IconTags', path: '/administrare/nomenclatoare', permissions: ['settings.view'] },
    ],
  },
  {
    label: 'Arhivă', icon: 'IconArchive', module: 'archive', permissions: ['funds.view'],
    children: [
      { label: 'Fonduri Arhivistice', icon: 'IconFolders', path: '/arhiva/fonduri', permissions: ['funds.view'] },
      { label: 'Serii Documentare', icon: 'IconListTree', path: '/arhiva/serii-documentare', permissions: ['series.view'] },
      { label: 'Nomenclator Arhivistic', icon: 'IconBooks', path: '/arhiva/nomenclator', permissions: ['classification.view'] },
      { label: 'Termene Păstrare', icon: 'IconCalendarTime', path: '/arhiva/termen-pastrare', permissions: ['retention.view'] },
      { label: 'Comenzi Transfer', icon: 'IconTruck', path: '/arhiva/transfer', permissions: ['transfer.view'] },
      { label: 'Cereri Retragere', icon: 'IconFileDownload', path: '/arhiva/retrageri', permissions: ['withdrawal.view'] },
      { label: 'Locații Arhivă', icon: 'IconBoxMultiple', path: '/arhiva/locatii', permissions: ['archive_locations.view'] },
      { label: 'Registru Evidență', icon: 'IconBook', path: '/arhiva/registru', permissions: ['evidence.view'] },
    ],
  },
  {
    label: 'Solicitări', icon: 'IconSend', module: 'requests', permissions: ['requests.view'],
    children: [
      { label: 'Toate solicitările', icon: 'IconList', path: '/solicitari', permissions: ['requests.view'] },
      { label: 'Solicitare nouă', icon: 'IconPlus', path: '/solicitari/noua', permissions: ['requests.create'] },
      { label: 'Consultări', icon: 'IconEye', path: '/solicitari/consultari', permissions: ['consultations.view'] },
    ],
  },
  { label: 'Rapoarte', icon: 'IconReport', path: '/administrare/rapoarte', module: 'reports', permissions: ['reports.view'] },
  { label: 'Audit', icon: 'IconHistory', path: '/administrare/audit', module: 'audit', permissions: ['audit.view'] },
  { label: 'Setări', icon: 'IconSettings', path: '/administrare/setari', module: 'settings', permissions: ['settings.view'] },
];

export function filterSidebarByPermissions(items: SidebarItem[], userPermissions: string[]): SidebarItem[] {
  return items.map((item) => {
    if (item.children && item.children.length > 0) {
      const filteredChildren = filterSidebarByPermissions(item.children, userPermissions);
      if (filteredChildren.length === 0 && !item.path) return null;
      return { ...item, children: filteredChildren };
    }
    const requiredPerms = item.permissions || [];
    if (requiredPerms.length > 0 && !requiredPerms.some((perm) => userPermissions.includes(perm))) return null;
    return item;
  }).filter(Boolean) as SidebarItem[];
}

export const sidebarSections = [
  { title: 'Principal', items: ['Dashboard'] },
  { title: 'Management', items: ['Utilizatori', 'Administrare', 'Arhivă', 'Solicitări'] },
  { title: 'Sistem', items: ['Rapoarte', 'Audit', 'Setări'] },
];

export default sidebarConfig;
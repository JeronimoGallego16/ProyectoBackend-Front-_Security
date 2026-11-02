import { NavItem } from './nav-item/nav-item';

export const navItems: NavItem[] = [
  {
    displayName: 'Users',
    iconName: 'solar:users-group-rounded-line-duotone',
    route: '/users',
    requiredRole: 'ADMIN',
  },
  {
    displayName: 'Profiles',
    iconName: 'solar:user-circle-line-duotone',
    route: '/profiles',
    requiredRole: 'ADMIN',
  },
  {
    displayName: 'Roles',
    iconName: 'solar:shield-user-line-duotone',
    route: '/roles',
    requiredRole: 'ADMIN',
  },
  {
    displayName: 'Permissions',
    iconName: 'solar:lock-keyhole-line-duotone',
    route: '/permissions',
    requiredRole: 'ADMIN',
  },
  {
    displayName: 'Assign Roles',
    iconName: 'solar:user-id-line-duotone',
    route: '/user-roles',
    requiredRole: 'ADMIN',
  },
  {
    displayName: 'Assign Permissions',
    iconName: 'solar:checklist-minimalistic-line-duotone',
    route: '/role-permissions',
    requiredRole: 'ADMIN',
  },
];

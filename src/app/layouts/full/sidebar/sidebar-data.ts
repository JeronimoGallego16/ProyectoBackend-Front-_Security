import { NavItem } from './nav-item/nav-item';

export const navItems: NavItem[] = [
  {
    displayName: 'Users',
    iconName: 'solar:users-group-rounded-line-duotone',
    route: '/users',
  },
  {
    displayName: 'Profiles',
    iconName: 'solar:user-circle-line-duotone',
    route: '/profiles',
  },
  {
    displayName: 'Roles',
    iconName: 'solar:shield-user-line-duotone',
    route: '/roles',
  },
  {
    displayName: 'Permissions',
    iconName: 'solar:lock-keyhole-line-duotone',
    route: '/permissions',
  },
  {
    displayName: 'Assign Roles',
    iconName: 'solar:user-id-line-duotone',
    route: '/user-roles',
  },
  {
    displayName: 'Assign Permissions',
    iconName: 'solar:checklist-minimalistic-line-duotone',
    route: '/role-permissions',
  },
];

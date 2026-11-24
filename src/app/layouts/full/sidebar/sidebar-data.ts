import { NavItem } from './nav-item/nav-item';

export const navItems: NavItem[] = [
  {
    displayName: 'Dashboard',
    iconName: 'solar:widget-2-line-duotone',
    route: '/dashboard',
  },
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
   {
    displayName: 'Sports',
    iconName: 'solar:football-line-duotone',
    route: '/sports',
    requiredRole: 'ADMIN',
  },
   {
     displayName: 'Skills',
     iconName: 'solar:star-line-duotone',
     route: '/skills',
     requiredRole: 'ADMIN',
   },
   {
     displayName: 'Players',
     iconName: 'solar:user-line-duotone',
     route: '/players',
     requiredRole: 'ADMIN',
   },
  {
    displayName: 'Teams',
    iconName: 'solar:users-group-rounded-line-duotone',
    route: '/teams',
    requiredRole: 'ADMIN',
  },
  {
    displayName: 'Matches',
    iconName: 'solar:calendar-mark-line-duotone',
    route: '/matches',
    requiredRole: 'ADMIN',
  },
  {
    displayName: 'Tournaments',
    iconName: 'solar:cup-star-line-duotone',
    route: '/tournaments',
    requiredRole: 'ADMIN',
  },
  {
    displayName: 'Assign Sports',
    iconName: 'solar:football-line-duotone',
    route: '/team-sports',
    requiredRole: 'ADMIN',
  },
  {
    displayName: 'Registrations',
    iconName: 'solar:clipboard-list-line-duotone',
    route: '/registrations',
    requiredRole: 'ADMIN',
  },
];

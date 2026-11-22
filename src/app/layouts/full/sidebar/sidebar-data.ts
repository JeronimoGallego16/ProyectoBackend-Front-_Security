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
  },
   {
     displayName: 'Skills',
     iconName: 'solar:star-line-duotone',
     route: '/skills',
   },
   {
     displayName: 'Players',
     iconName: 'solar:user-line-duotone',
     route: '/players',
   },
  {
    displayName: 'Teams',
    iconName: 'solar:users-group-rounded-line-duotone',
    route: '/teams',
  },
  {
    displayName: 'Matches',
    iconName: 'solar:calendar-mark-line-duotone',
    route: '/matches',
  },
  {
    displayName: 'Tournaments',
    iconName: 'solar:cup-star-line-duotone',
    route: '/tournaments',
  },
  {
    displayName: 'Assign Sports',
    iconName: 'solar:football-line-duotone',
    route: '/team-sports',
  },
  {
    displayName: 'Registrations',
    iconName: 'solar:clipboard-list-line-duotone',
    route: '/registrations',
  },
];

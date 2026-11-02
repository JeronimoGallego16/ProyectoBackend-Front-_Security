import { Routes } from '@angular/router';
import { BlankComponent } from './layouts/blank/blank.component';
import { FullComponent } from './layouts/full/full.component';
import { authGuard } from './services/auth.guard';
import { roleGuard } from './services/role.guard';
import { AccessDeniedComponent } from './pages/access-denied/access-denied.component';

export const routes: Routes = [
  {
    path: '',
    component: FullComponent,
    canActivateChild: [authGuard],
    children: [
      {
        path: '',
        redirectTo: '/dashboard',
        pathMatch: 'full',
      },
      {
        path: 'dashboard',
        loadChildren: () =>
          import('./pages/pages.routes').then((m) => m.PagesRoutes),
      },
      {
        path: 'roles',
        canActivate: [roleGuard],
        data: { requiredRole: 'ADMIN' },
        loadComponent: () =>
          import('./pages/roles/roles.component').then((m) => m.RolesComponent),
      },
      {
        path: 'permissions',
        canActivate: [roleGuard],
        data: { requiredRole: 'ADMIN' },
        loadComponent: () =>
          import('./pages/permissions/permissions.component').then(
            (m) => m.PermissionsComponent
          ),
      },
      {
        path: 'role-permissions',
        canActivate: [roleGuard],
        data: { requiredRole: 'ADMIN' },
        loadChildren: () =>
          import('./pages/role-permissions/role-permissions.routes').then(
            (m) => m.RolePermissionsRoutes
          ),
      },
      {
        path: 'user-roles',
        canActivate: [roleGuard],
        data: { requiredRole: 'ADMIN' },
        loadChildren: () =>
          import('./pages/user-roles/user-roles.routes').then(
            (m) => m.UserRolesRoutes
          ),
      },
      {
        path: 'profiles',
        loadComponent: () =>
          import('./pages/profile/profile.component').then((m) => m.ProfileComponent),
      },
      {
        path: 'my-profile',
        loadComponent: () =>
          import('./pages/my-profile/my-profile.component').then((m) => m.MyProfileComponent),
      },
      {
        path: 'users',
        canActivate: [roleGuard],
        data: { requiredRole: 'ADMIN' },
        loadComponent: () =>
          import('./pages/users/users.component').then((m) => m.UsersComponent),
      }
    ],
  },
  {
    path: '',
    component: BlankComponent,
    children: [
      {
        path: 'access-denied',
        component: AccessDeniedComponent,
      },
      {
        path: 'authentication',
        loadChildren: () =>
          import('./pages/authentication/authentication.routes').then(
            (m) => m.AuthenticationRoutes
          ),
      },
      {
        path: 'profile-setup',
        canActivate: [authGuard],
        loadComponent: () =>
          import('./pages/profile-setup/profile-setup.component').then(
            (m) => m.ProfileSetupComponent
          ),
      },
    ],
  },
  {
    path: '**',
    redirectTo: 'authentication/error',
  },
];

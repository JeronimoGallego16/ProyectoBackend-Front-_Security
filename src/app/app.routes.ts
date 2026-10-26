import { Routes } from '@angular/router';
import { BlankComponent } from './layouts/blank/blank.component';
import { FullComponent } from './layouts/full/full.component';
import { AppSideLoginComponent } from './pages/authentication/side-login/side-login.component';
import { AppSideRegisterComponent } from './pages/authentication/side-register/side-register.component';

export const routes: Routes = [
  {
    path: '',
    component: FullComponent,
    children: [
      {
        path: '',
        redirectTo: '/auth/login',
        pathMatch: 'full',
      },
      {
        path: 'dashboard',
        loadChildren: () =>
          import('./pages/pages.routes').then((m) => m.PagesRoutes),
      },
      {
        path: 'ui-components',
        loadChildren: () =>
          import('./pages/ui-components/ui-components.routes').then(
            (m) => m.UiComponentsRoutes
          ),
      },
      {
        path: 'extra',
        loadChildren: () =>
          import('./pages/extra/extra.routes').then((m) => m.ExtraRoutes),
      },
      {
        path: 'roles',
        loadComponent: () =>
          import('./pages/roles/roles.component').then((m) => m.RolesComponent),
      },
      {
        path: 'permissions',
        loadComponent: () =>
          import('./pages/permissions/permissions.component').then(
            (m) => m.PermissionsComponent
          ),
      },
      {
        path: 'role-permissions',
        loadChildren: () =>
          import('./pages/role-permissions/role-permissions.routes').then(
            (m) => m.RolePermissionsRoutes
          ),
      },
      {
        path: 'profiles',
        loadComponent: () =>
          import('./pages/profile/profile.component').then((m) => m.ProfileComponent),
      }
    ],
  },
  {
    path: '',
    component: BlankComponent,
    children: [
      {
        path: 'auth',
        children: [
          {
            path: 'login',
            component: AppSideLoginComponent,
          },
          {
            path: 'register',
            component: AppSideRegisterComponent,
          },
        ],
      },
    ],
  },
  {
    path: '**',
    redirectTo: 'auth/login',
  },
];

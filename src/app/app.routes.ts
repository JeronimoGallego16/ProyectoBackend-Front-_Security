import { Routes } from '@angular/router';
import { BlankComponent } from './layouts/blank/blank.component';
import { FullComponent } from './layouts/full/full.component';
import { authGuard } from './services/auth.guard';
import { roleGuard } from './services/role.guard';
import { AccessDeniedComponent } from './pages/security/access-denied/access-denied.component';

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
          import('./pages/security/roles/roles.component').then((m) => m.RolesComponent),
      },
      {
        path: 'permissions',
        canActivate: [roleGuard],
        data: { requiredRole: 'ADMIN' },
        loadComponent: () =>
          import('./pages/security/permissions/permissions.component').then(
            (m) => m.PermissionsComponent
          ),
      },
      {
        path: 'sports',
        loadComponent: () =>
          import('./pages/business/sports/sports.component').then(
            (m) => m.SportsComponent
          ),
      },
      {
        path: 'teams',
        loadComponent: () =>
          import('./pages/business/teams/teams.component').then(
            (m) => m.TeamsComponent
          ),
      },
      {
        path: 'matches',
        loadComponent: () =>
          import('./pages/business/matches/matches.component').then(
            (m) => m.MatchesComponent
          ),
      },
      {
        path: 'tournaments',
        loadComponent: () =>
          import('./pages/business/tournaments/tournaments.component').then(
            (m) => m.TournamentsComponent
          ),
      },
      {
        path: 'tournaments/:id',
        loadComponent: () =>
          import('./pages/business/tournaments/tournament-detail.component').then(
            (m) => m.TournamentDetailComponent
          ),
      },
      {
        path: 'team-sports',
        loadComponent: () =>
          import('./pages/business/team-sports/team-sports.component').then(
            (m) => m.TeamSportsComponent
          ),
      },
      {
        path: 'registrations',
        loadComponent: () =>
          import('./pages/business/registrations/registrations.component').then(
            (m) => m.RegistrationsComponent
          ),
      },
      {
        path: 'role-permissions',
        canActivate: [roleGuard],
        data: { requiredRole: 'ADMIN' },
        loadChildren: () =>
          import('./pages/security/role-permissions/role-permissions.routes').then(
            (m) => m.RolePermissionsRoutes
          ),
      },
      {
        path: 'user-roles',
        canActivate: [roleGuard],
        data: { requiredRole: 'ADMIN' },
        loadChildren: () =>
          import('./pages/security/user-roles/user-roles.routes').then(
            (m) => m.UserRolesRoutes
          ),
      },
      {
        path: 'profiles',
        canActivate: [roleGuard],
        data: { requiredRole: 'ADMIN' },
        loadComponent: () =>
          import('./pages/security/profile/profile.component').then((m) => m.ProfileComponent),
      },
      {
        path: 'my-profile',
        loadComponent: () =>
          import('./pages/security/my-profile/my-profile.component').then((m) => m.MyProfileComponent),
      },
      {
        path: 'users',
        canActivate: [roleGuard],
        data: { requiredRole: 'ADMIN' },
        loadComponent: () =>
          import('./pages/security/users/users.component').then((m) => m.UsersComponent),
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
          import('./pages/security/authentication/authentication.routes').then(
            (m) => m.AuthenticationRoutes
          ),
      },
      {
        path: 'profile-setup',
        canActivate: [authGuard],
        loadComponent: () =>
          import('./pages/security/profile-setup/profile-setup.component').then(
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

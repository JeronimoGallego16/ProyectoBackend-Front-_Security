import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { MaterialModule } from 'src/app/material.module';
import { AuthService } from 'src/app/services/auth.service';
import { AuthorizationService } from 'src/app/services/authorization.service';
import { UserService } from 'src/app/services/user.service';
import { navItems } from 'src/app/layouts/full/sidebar/sidebar-data';
import { NavItem } from 'src/app/layouts/full/sidebar/nav-item/nav-item';

interface DashboardCard {
  title: string;
  description: string;
  icon: string;
  route: string;
  color: string;
}

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, MaterialModule],
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.scss'],
})
export class DashboardComponent implements OnInit {
  public userName = 'User';
  public cards: DashboardCard[] = [];

  private readonly descriptions: Record<string, string> = {
    Users: 'Manage registered users',
    Profiles: 'Manage user profiles',
    Roles: 'Manage system roles',
    Permissions: 'Manage system permissions',
    'Assign Roles': 'Assign roles to users',
    'Assign Permissions': 'Assign permissions to roles',
  };

  private readonly icons: Record<string, string> = {
    Users: 'people',
    Profiles: 'person',
    Roles: 'shield',
    Permissions: 'lock',
    'Assign Roles': 'manage_accounts',
    'Assign Permissions': 'rule',
  };

  private readonly colors = [
    'from-blue-600 to-blue-700',
    'from-emerald-600 to-emerald-700',
    'from-orange-600 to-orange-700',
    'from-purple-600 to-purple-700',
    'from-cyan-600 to-cyan-700',
    'from-rose-600 to-rose-700',
  ];

  constructor(
    private readonly authService: AuthService,
    private readonly authorizationService: AuthorizationService,
    private readonly userService: UserService,
    public readonly router: Router
  ) {}

  public ngOnInit(): void {
    this.authService.getSession().subscribe({
      next: (session) => {
      this.userService.findById(session.id).subscribe({
        next: (user) => {
          this.userName = user.name;
        },
      });
      },
    });

    this.authorizationService.getCurrentUserRoles().subscribe({
      next: (roles) => {
        if (this.authorizationService.hasRole(roles, 'ADMIN')) {
          this.cards = navItems
            .filter((item) => item.route && item.requiredRole === 'ADMIN')
            .map((item, index) => this.toCard(item, index));
        }
      },
      error: () => {
        this.cards = [];
      },
    });
  }

  public navigateTo(route: string): void {
    void this.router.navigateByUrl(route);
  }

  private toCard(item: NavItem, index: number): DashboardCard {
    return {
      title: item.displayName ?? '',
      description: this.descriptions[item.displayName ?? ''] ?? 'Open this system module',
      icon: this.icons[item.displayName ?? ''] ?? 'apps',
      route: item.route ?? '/',
      color: this.colors[index % this.colors.length],
    };
  }
}

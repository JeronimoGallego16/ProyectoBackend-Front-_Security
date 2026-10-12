import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { MatSnackBar } from '@angular/material/snack-bar';
import { finalize, forkJoin, Observable, of } from 'rxjs';
import { catchError } from 'rxjs/operators';
import {
  SelectableTableComponent,
} from 'src/app/components/selectable-table/selectable-table.component';
import { TableColumn } from 'src/app/components/table-list/table-list.component';
import { MaterialModule } from 'src/app/material.module';
import { Permission } from 'src/app/models/permission.model';
import { RolePermissionDetail } from 'src/app/models/role-detail-with-permissions.model';
import { RolePermissionRequestDTO } from 'src/app/models/dtos/role-permission-request.dto';
import { PermissionService } from 'src/app/services/permission.service';
import { RolePermissionService } from 'src/app/services/role-permission.service';
import { RoleService } from 'src/app/services/role.service';

/**
 * Presentation layer page that manages the assignment of permissions to a specific role.
 * It displays all available permissions using the selectable table component and
 * pre-selects those already assigned to the role. Users can assign selected permissions
 * to the role or delete previously assigned permissions.
 */
@Component({
  selector: 'app-role-permissions',
  standalone: true,
  imports: [CommonModule, MaterialModule, SelectableTableComponent],
  templateUrl: './role-permissions.component.html',
  styleUrls: ['./role-permissions.component.scss'],
})
export class RolePermissionsComponent implements OnInit {
  /**
   * Column definition consumed by the selectable table component.
   */
  public columns: TableColumn[] = [
    { field: 'id', header: 'ID' },
    { field: 'url', header: 'URL' },
    { field: 'method', header: 'Method' },
  ];

  public roleId: number | null = null;
  public roleName: string | null = null;
  public permissions: Permission[] = [];
  public assignedPermissionIds: number[] = [];
  public selectedPermissions: Permission[] = [];
  public isLoading = false;
  public isSaving = false;

  /**
   * Creates an instance of the role permissions page.
   *
   * @param route - Activated route to extract query parameters.
   * @param router - Angular router service for navigation.
   * @param snackBar - Angular Material service used to show user feedback.
   * @param permissionService - Service that provides permission data access.
   * @param rolePermissionService - Service that manages role-permission assignments.
   * @param roleService - Service that provides role details with permissions.
   */
  constructor(
    private readonly route: ActivatedRoute,
    private readonly router: Router,
    private readonly snackBar: MatSnackBar,
    private readonly permissionService: PermissionService,
    private readonly rolePermissionService: RolePermissionService,
    private readonly roleService: RoleService
  ) {}

  /**
   * Lifecycle hook that initializes the component by loading role and permission data.
   */
  public ngOnInit(): void {
    this.route.queryParams.subscribe((params) => {
      const roleIdParam = params['roleId'];
      if (!roleIdParam) {
        this.showMessage('Role ID is required.');
        this.router.navigate(['/roles']);
        return;
      }

      this.roleId = Number(roleIdParam);
      if (isNaN(this.roleId)) {
        this.showMessage('Invalid role ID.');
        this.router.navigate(['/roles']);
        return;
      }

      this.loadData();
    });
  }

  /**
   * Loads all permissions and the current role's assigned permissions.
   */
  private loadData(): void {
    this.isLoading = true;

    const permissions$ = this.permissionService.findAll().pipe(
      catchError(() => {
        this.showMessage('Could not load permissions. Please try again.');
        return of([] as Permission[]);
      })
    );

    const roleDetails$ = this.roleId
      ? this.roleService.findByIdWithPermissions(this.roleId).pipe(
          catchError(() => {
            this.showMessage('Could not load role details. Please try again.');
            return of(null);
          })
        )
      : of(null);

    forkJoin([permissions$, roleDetails$])
      .pipe(finalize(() => (this.isLoading = false)))
      .subscribe({
        next: ([permissions, roleDetails]) => {
          this.permissions = permissions;
          if (roleDetails) {
            this.roleName = roleDetails.name;
            this.assignedPermissionIds = roleDetails.permissions.map(
              (detail: RolePermissionDetail) => detail.permission.id
            );
          } else {
            this.assignedPermissionIds = [];
          }
        },
      });
  }

  /**
   * Handles selection changes from the selectable table component.
   *
   * @param selected - Array of selected permission objects.
   */
  public onSelectionChange(selected: Permission[]): void {
    this.selectedPermissions = selected;
  }

  /**
   * Updates the permissions assigned to the role by creating new assignments
   * for selected permissions not previously assigned and deleting assignments
   * for permissions that were previously assigned but are no longer selected.
   */
  public onAssignPermissions(): void {
    if (this.roleId === null) {
      this.showMessage('Role ID is required.');
      return;
    }

    this.isSaving = true;

    const selectedIds = new Set<number>(
      this.selectedPermissions.map((permission) => permission.id)
    );
    const assignedIdsSet = new Set<number>(this.assignedPermissionIds);

    const toCreate: RolePermissionRequestDTO[] = [];
    selectedIds.forEach((id) => {
      if (!assignedIdsSet.has(id)) {
        toCreate.push({
          roleId: this.roleId!,
          permissionId: id,
        });
      }
    });

    const toDelete: number[] = [];
    assignedIdsSet.forEach((id) => {
      if (!selectedIds.has(id)) {
        toDelete.push(id);
      }
    });

    const createObservables: Observable<any>[] = toCreate.map(
      (payload) => this.rolePermissionService.create(payload)
    );

    const deleteObservables: Observable<void>[] = toDelete.map((id) =>
      this.rolePermissionService.delete(this.roleId!, id)
    );

    const operations: Observable<any>[] = [...createObservables, ...deleteObservables];

    if (operations.length === 0) {
      this.showMessage('No changes to apply.');
      this.isSaving = false;
      return;
    }

    forkJoin(operations)
      .pipe(finalize(() => (this.isSaving = false)))
      .subscribe({
        next: () => {
          this.showMessage('Permissions updated successfully.');
          this.loadData();
        },
        error: () => {
          this.showMessage('Could not update permissions. Please try again.');
        },
      });
  }

  /**
   * Navigates back to the roles page.
   */
  public onGoBack(): void {
    this.router.navigate(['/roles']);
  }

  /**
   * Shows a short notification message to the user.
   *
   * @param message - Text to display in the snack bar.
   */
  private showMessage(message: string): void {
    this.snackBar.open(message, 'Close', {
      duration: 3000,
      horizontalPosition: 'end',
      verticalPosition: 'top',
    });
  }
}

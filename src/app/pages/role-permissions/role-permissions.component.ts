import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { MatSnackBar } from '@angular/material/snack-bar';
import { finalize, forkJoin, Observable, of } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { SelectableTableComponent } from 'src/app/components/selectable-table/selectable-table.component';
import { MaterialModule } from 'src/app/material.module';
import { Permission } from 'src/app/models/permission.model';
import { Role } from 'src/app/models/role.model';
import { RolePermissionDetail } from 'src/app/models/role-detail-with-permissions.model';
import { RolePermissionRequestDTO } from 'src/app/models/dtos/role-permission-request.dto';
import { PermissionService } from 'src/app/services/permission.service';
import { RolePermissionService } from 'src/app/services/role-permission.service';
import { RoleService } from 'src/app/services/role.service';

/**
 * Presentation layer page that manages the assignment of permissions to roles.
 * It displays a list of roles to select from, and a matrix where permissions are
 * shown as columns and entities/resources as rows. Selections indicate that the
 * chosen role can access a specific resource with the given permission.
 */
@Component({
  selector: 'app-role-permissions',
  standalone: true,
  imports: [CommonModule, MaterialModule, SelectableTableComponent],
  templateUrl: './role-permissions.component.html',
  styleUrls: ['./role-permissions.component.scss'],
})
export class RolePermissionsComponent implements OnInit {
  public roles: Role[] = [];
  public roleId: number | null = null;
  public roleName: string | null = null;
  public roleDescription: string | null = null;

  public permissions: Permission[] = [];
  public assignedPermissionIds: number[] = [];
  public selectedPermissions: Permission[] = [];

  public matrixColumns: Array<{ id: string; label: string; action: string }> = [
    { id: 'LIST', label: 'LIST (GET)', action: 'LIST' },
    { id: 'SEE', label: 'SEE (GET)', action: 'SEE' },
    { id: 'CREATE', label: 'CREATE (POST)', action: 'CREATE' },
    { id: 'MODIFY', label: 'MODIFY (PUT)', action: 'MODIFY' },
    { id: 'DELETE', label: 'DELETE (DELETE)', action: 'DELETE' },
  ];
  public matrixRows: Array<{ entity: string }> = [];
  public initialSelectedMatrixCells: string[] = [];

  public permissionsByEntityAction: Map<string, Permission | undefined> = new Map();

  public isLoading = false;
  public isSaving = false;

  /**
   * Creates an instance of the role permissions page.
   *
   * @param snackBar - Angular Material service used to show user feedback.
   * @param permissionService - Service that provides permission data access.
   * @param rolePermissionService - Service that manages role-permission assignments.
   * @param roleService - Service that provides role data access.
   */
  constructor(
    private readonly snackBar: MatSnackBar,
    private readonly permissionService: PermissionService,
    private readonly rolePermissionService: RolePermissionService,
    private readonly roleService: RoleService
  ) {}

  /**
   * Lifecycle hook that initializes the component by loading roles and permissions.
   */
  public ngOnInit(): void {
    this.loadInitialData();
  }

  /**
   * Loads all roles and permissions for the matrix view.
   */
  private loadInitialData(): void {
    this.isLoading = true;

    const roles$ = this.roleService.findAll().pipe(
      catchError(() => {
        this.showMessage('Could not load roles. Please try again.');
        return of([] as Role[]);
      })
    );

    const permissions$ = this.permissionService.findAll().pipe(
      catchError(() => {
        this.showMessage('Could not load permissions. Please try again.');
        return of([] as Permission[]);
      })
    );

    forkJoin([roles$, permissions$])
      .pipe(finalize(() => (this.isLoading = false)))
      .subscribe({
        next: ([roles, permissions]) => {
          this.roles = roles;
          this.permissions = permissions;
          this.buildMatrix(permissions);
        },
      });
  }

  /**
   * Builds matrix structure from permissions grouping by entity.
   */
  private buildMatrix(permissions: Permission[]): void {
    const entitySet = new Set<string>();
    this.permissionsByEntityAction.clear();
    permissions.forEach((p) => {
      if (p.entity) {
        entitySet.add(p.entity);
      }
      const key = this.getPermissionKey(p);
      if (key) {
        this.permissionsByEntityAction.set(key, p);
      }
    });
    this.matrixRows = Array.from(entitySet)
      .sort((a, b) => a.localeCompare(b))
      .map((entity) => ({ entity }));
  }

  /**
   * Maps permission to action key.
   */
  private getPermissionKey(permission: Permission): string | null {
    if (!permission.entity) return null;
    const method = permission.method.toUpperCase();
    if (method === 'POST') return `${permission.entity}|CREATE`;
    if (method === 'PUT') return `${permission.entity}|MODIFY`;
    if (method === 'DELETE') return `${permission.entity}|DELETE`;
    if (method === 'GET') {
      const url = permission.url.toLowerCase();
      if (url.includes('/{') || url.includes(':id') || url.match(/\/[^/]+\/[^/?]+$/) && !url.endsWith('s') && !url.includes('list')) {
        return `${permission.entity}|SEE`;
      }
      return `${permission.entity}|LIST`;
    }
    return null;
  }

  /**
   * Handles role selection from the list.
   */
  public onRoleSelect(role: Role): void {
    this.roleId = role.id;
    this.roleName = role.name;
    this.roleDescription = role.description;
    this.loadRolePermissions(role.id);
  }

  /**
   * Loads permissions assigned to the selected role.
   */
  private loadRolePermissions(roleId: number): void {
    this.isLoading = true;
    this.roleService
      .findByIdWithPermissions(roleId)
      .pipe(
        catchError(() => {
          this.showMessage('Could not load role details. Please try again.');
          return of(null);
        }),
        finalize(() => (this.isLoading = false))
      )
      .subscribe({
        next: (roleDetails) => {
          this.assignedPermissionIds = [];
          this.initialSelectedMatrixCells = [];
          if (roleDetails) {
            roleDetails.permissions.forEach((detail: RolePermissionDetail) => {
              const permission = detail.permission;
              this.assignedPermissionIds.push(permission.id);
              const key = this.getPermissionKey(permission);
              if (key) {
                this.initialSelectedMatrixCells.push(key);
              }
            });
            this.initialSelectedMatrixCells = [...this.initialSelectedMatrixCells];
          }
        },
      });
  }

  /**
   * Handles matrix selection changes.
   */
  public onMatrixSelectionChange(selected: any[]): void {
    const permissionMap = new Map<number, Permission>();
    selected.forEach((item) => {
      const row = item.row;
      const column = item.column;
      if (row && column) {
        const key = `${row.entity}|${column.action || column.id}`;
        const permission = this.permissionsByEntityAction.get(key);
        if (permission) {
          permissionMap.set(permission.id, permission);
        }
      } else if (item.permission) {
        permissionMap.set(item.permission.id, item.permission);
      }
    });
    this.selectedPermissions = Array.from(permissionMap.values());
  }

  /**
   * Updates the permissions assigned to the role by creating new assignments
   * and deleting those no longer selected.
   */
  public onAssignPermissions(): void {
    if (this.roleId === null) {
      this.showMessage('Select a role first.');
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

    const createObservables: Observable<any>[] = toCreate.map((payload) =>
      this.rolePermissionService.create(payload)
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
          this.loadRolePermissions(this.roleId!);
        },
        error: () => {
          this.showMessage('Could not update permissions. Please try again.');
        },
      });
  }

  /**
   * Shows a short notification message to the user.
   */
  private showMessage(message: string): void {
    this.snackBar.open(message, 'Close', {
      duration: 3000,
      horizontalPosition: 'end',
      verticalPosition: 'top',
    });
  }
}

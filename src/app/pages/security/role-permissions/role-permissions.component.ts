import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { finalize, forkJoin, Observable, of } from 'rxjs';
import { catchError } from 'rxjs/operators';
import {
  EntitySelectorComponent,
  EntitySelectorOption,
} from 'src/app/components/entity-selector/entity-selector.component';
import { SelectableTableComponent } from 'src/app/components/selectable-table/selectable-table.component';
import { MaterialModule } from 'src/app/material.module';
import { FeedbackCase } from 'src/app/models/feedback-case';
import { Permission } from 'src/app/models/security/permission.model';
import { Role } from 'src/app/models/security/role.model';
import { RolePermissionRequestDTO } from 'src/app/models/dtos/security/role-permission-request.dto';
import { FeedbackHandlerService } from 'src/app/services/feedback-handler.service';
import { PermissionService } from 'src/app/services/security/permission.service';
import { RolePermissionService } from 'src/app/services/security/role-permission.service';
import { RoleService } from 'src/app/services/security/role.service';

/**
 * Presentation layer page that manages the assignment of permissions to roles.
 * It displays a list of roles to select from, and a matrix where permissions are
 * shown as columns and entities/resources as rows. Selections indicate that the
 * chosen role can access a specific resource with the given permission.
 */
@Component({
  selector: 'app-role-permissions',
  standalone: true,
  imports: [
    CommonModule,
    MaterialModule,
    EntitySelectorComponent,
    SelectableTableComponent,
  ],
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
  public selectedPermissionIds: number[] = [];
  public rolePermissionsLoadError: string | null = null;

  public isLoading = false;
  public isSaving = false;

  /**
   * Builds selector options from the available roles.
   *
   * @returns Role options with their descriptions.
   */
  public get roleOptions(): EntitySelectorOption[] {
    return this.roles.map((role) => ({
      id: role.id,
      label: role.name,
      description: role.description,
    }));
  }

  /**
   * Creates an instance of the role permissions page.
   *
   * @param feedbackHandlerService - Service that publishes user feedback notifications.
   * @param permissionService - Service that provides permission data access.
   * @param rolePermissionService - Service that manages role-permission assignments.
   * @param roleService - Service that provides role data access.
   */
  constructor(
    private readonly feedbackHandlerService: FeedbackHandlerService,
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
      catchError((error) => {
        this.feedbackHandlerService.error(
          String(error?.status ?? FeedbackCase.SERVER_ERROR),
          'Could not load roles. Please try again.'
        );
        return of([] as Role[]);
      })
    );

    const permissions$ = this.permissionService.findAll().pipe(
      catchError((error) => {
        this.feedbackHandlerService.error(
          String(error?.status ?? FeedbackCase.SERVER_ERROR),
          'Could not load permissions. Please try again.'
        );
        return of([] as Permission[]);
      })
    );

    forkJoin([roles$, permissions$])
      .pipe(finalize(() => (this.isLoading = false)))
      .subscribe({
        next: ([roles, permissions]) => {
          this.roles = roles;
          this.permissions = permissions;
        },
      });
  }

  /**
   * Handles role selection from the list.
   */
  public onRoleSelect(role: Role): void {
    this.roleId = role.id;
    this.roleName = role.name;
    this.roleDescription = role.description;
    this.assignedPermissionIds = [];
    this.selectedPermissionIds = [];
    this.rolePermissionsLoadError = null;
    this.loadRolePermissions(role.id);
  }

  /**
   * Selects a role emitted by the shared entity selector.
   *
   * @param roleId - Identifier of the selected role.
   */
  public onRoleOptionSelect(roleId: number | string): void {
    const role = this.roles.find((candidate) => candidate.id === Number(roleId));
    if (role) {
      this.onRoleSelect(role);
    }
  }

  /**
   * Loads permissions assigned to the selected role.
   */
  private loadRolePermissions(roleId: number): void {
    this.isLoading = true;
    this.roleService
      .findByIdWithPermissions(roleId)
      .pipe(
        catchError((error) => {
          this.rolePermissionsLoadError =
            'Could not load role details. Please try again.';
          this.feedbackHandlerService.error(
            String(error?.status ?? FeedbackCase.SERVER_ERROR),
            this.rolePermissionsLoadError
          );
          return of(null);
        }),
        finalize(() => (this.isLoading = false))
      )
      .subscribe({
        next: (roleDetails) => {
          if (!roleDetails) {
            return;
          }

          this.rolePermissionsLoadError = null;
          this.assignedPermissionIds = roleDetails.permissions.map(
            (detail) => detail.permission.id
          );
          this.selectedPermissionIds = [...this.assignedPermissionIds];
        },
      });
  }

  /**
   * Updates selected permissions while retaining assignments absent from the catalog.
   *
   * @param selectedPermissionIds - Permission identifiers selected in the matrix.
   */
  public onPermissionSelectionChange(selectedPermissionIds: number[]): void {
    const catalogPermissionIds = new Set(
      this.permissions.map((permission) => permission.id)
    );
    const unavailableAssignedIds = this.assignedPermissionIds.filter(
      (permissionId) => !catalogPermissionIds.has(permissionId)
    );

    this.selectedPermissionIds = Array.from(
      new Set([...selectedPermissionIds, ...unavailableAssignedIds])
    );
  }

  /**
   * Updates the permissions assigned to the role by creating new assignments
   * and deleting those no longer selected.
   */
  public onAssignPermissions(): void {
    if (this.roleId === null) {
      this.feedbackHandlerService.warning(FeedbackCase.BAD_REQUEST, 'Select a role first.');
      return;
    }
    if (this.rolePermissionsLoadError) {
      return;
    }

    this.isSaving = true;

    const selectedIds = new Set<number>(this.selectedPermissionIds);
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
      this.feedbackHandlerService.info(FeedbackCase.INFO, 'No changes to apply.');
      this.isSaving = false;
      return;
    }

    forkJoin(operations)
      .pipe(finalize(() => (this.isSaving = false)))
      .subscribe({
        next: () => {
          this.feedbackHandlerService.success(
            FeedbackCase.OK,
            'Permissions updated successfully.'
          );
          this.loadRolePermissions(this.roleId!);
        },
        error: (error) =>
          this.feedbackHandlerService.error(
            String(error?.status ?? FeedbackCase.SERVER_ERROR),
            'Could not update permissions. Please try again.'
          ),
      });
  }
}

import { Component, EventEmitter, Input, Output } from '@angular/core';
import { MaterialModule } from 'src/app/material.module';
import { Permission } from 'src/app/models/security/permission.model';

/**
 * Displays permissions in an entity-by-HTTP-method matrix with one checkbox
 * for each endpoint permission.
 */
@Component({
  selector: 'app-selectable-table',
  standalone: true,
  imports: [MaterialModule],
  templateUrl: './selectable-table.component.html',
  styleUrls: ['./selectable-table.component.scss'],
})
export class SelectableTableComponent {
  /** Endpoint permissions displayed in the matrix. */
  @Input() public permissions: ReadonlyArray<Permission> = [];

  /** Identifiers of the endpoint permissions that are currently selected. */
  @Input() public selectedPermissionIds: ReadonlyArray<number> = [];

  /** Emits the identifiers of all selected endpoint permissions. */
  @Output() public selectedPermissionIdsChange = new EventEmitter<number[]>();

  private readonly preferredMethodOrder = [
    'GET',
    'POST',
    'PUT',
    'PATCH',
    'DELETE',
  ];

  /**
   * Returns the distinct entity names used by the endpoint permissions.
   *
   * @returns Sorted entity names, including a fallback for missing entities.
   */
  public get entities(): string[] {
    return Array.from(
      new Set(this.permissions.map((permission) => this.getEntityName(permission)))
    ).sort((first, second) => first.localeCompare(second));
  }

  /**
   * Returns distinct HTTP methods with common methods in a stable order.
   *
   * @returns HTTP methods present in the permission catalog.
   */
  public get methods(): string[] {
    const availableMethods = new Set(
      this.permissions.map((permission) => permission.method.toUpperCase())
    );
    const preferredMethods = this.preferredMethodOrder.filter((method) =>
      availableMethods.delete(method)
    );

    return [...preferredMethods, ...Array.from(availableMethods).sort()];
  }

  /**
   * Returns permissions for one entity and HTTP method cell.
   *
   * @param entity - Entity row displayed in the matrix.
   * @param method - HTTP method column displayed in the matrix.
   * @returns Endpoint permissions belonging to the selected cell.
   */
  public getCellPermissions(entity: string, method: string): Permission[] {
    return this.permissions
      .filter(
        (permission) =>
          this.getEntityName(permission) === entity &&
          permission.method.toUpperCase() === method
      )
      .slice()
      .sort((first, second) => first.url.localeCompare(second.url));
  }

  /**
   * Checks whether an endpoint permission is selected.
   *
   * @param permissionId - Identifier of the endpoint permission.
   * @returns True when the permission is selected.
   */
  public isSelected(permissionId: number): boolean {
    return this.selectedPermissionIds.includes(permissionId);
  }

  /**
   * Emits the updated selection after a permission checkbox changes.
   *
   * @param permissionId - Identifier of the changed endpoint permission.
   * @param checked - Whether the permission is now selected.
   */
  public togglePermission(permissionId: number, checked: boolean): void {
    const selectedIds = new Set(this.selectedPermissionIds);
    if (checked) {
      selectedIds.add(permissionId);
    } else {
      selectedIds.delete(permissionId);
    }

    this.selectedPermissionIdsChange.emit(
      Array.from(selectedIds).sort((first, second) => first - second)
    );
  }

  /**
   * Resolves the entity label, grouping missing entity values safely.
   *
   * @param permission - Endpoint permission to inspect.
   * @returns The entity name or an uncategorized label.
   */
  private getEntityName(permission: Permission): string {
    return permission.entity?.trim() || 'Uncategorized';
  }
}

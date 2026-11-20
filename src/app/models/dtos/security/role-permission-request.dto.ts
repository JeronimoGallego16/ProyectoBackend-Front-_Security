/**
 * Data Transfer Object used as the HTTP request payload for creating a
 * {@link RolePermission} assignment.
 *
 * It contains the identifiers of the role and permission to be linked.
 */
export interface RolePermissionRequestDTO {
  roleId: number;
  permissionId: number;
}

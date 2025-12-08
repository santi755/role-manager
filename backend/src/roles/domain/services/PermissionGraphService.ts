import { Permission } from '../Permission';
import { PermissionId } from '../value-objects/PermissionId';

export class PermissionGraphService {
  /**
   * Resolves all permission dependencies using DFS
   * @param permission The permission to resolve dependencies for
   * @param allPermissions Map of all permissions in the system
   * @returns Set of all required permission IDs (including transitive dependencies)
   */
  resolvePermissionDependencies(
    permission: Permission,
    allPermissions: Map<string, Permission>,
  ): Set<PermissionId> {
    const dependencies = new Set<PermissionId>();
    const visited = new Set<string>();

    this.resolveDependenciesDFS(
      permission.getId(),
      allPermissions,
      dependencies,
      visited,
    );

    return dependencies;
  }

  private resolveDependenciesDFS(
    permissionId: PermissionId,
    allPermissions: Map<string, Permission>,
    dependencies: Set<PermissionId>,
    visited: Set<string>,
  ): void {
    const permissionIdStr = permissionId.toString();

    if (visited.has(permissionIdStr)) {
      return;
    }

    visited.add(permissionIdStr);

    const permission = allPermissions.get(permissionIdStr);
    if (!permission) {
      return;
    }

    for (const parentPermissionId of permission.getParentPermissions()) {
      dependencies.add(parentPermissionId);
      this.resolveDependenciesDFS(
        parentPermissionId,
        allPermissions,
        dependencies,
        visited,
      );
    }
  }

  /**
   * Checks if one permission implies another through the dependency graph
   * @param permission The permission to check
   * @param targetPermissionId The target permission ID to check for
   * @param allPermissions Map of all permissions in the system
   * @returns true if permission implies targetPermission
   */
  implies(
    permission: Permission,
    targetPermissionId: PermissionId,
    allPermissions: Map<string, Permission>,
  ): boolean {
    if (permission.getId().equals(targetPermissionId)) {
      return true;
    }

    const dependencies = this.resolvePermissionDependencies(
      permission,
      allPermissions,
    );

    return Array.from(dependencies).some((dep) =>
      dep.equals(targetPermissionId),
    );
  }

  /**
   * Gets all permissions required for a given permission (including itself)
   * @param permission The permission to get requirements for
   * @param allPermissions Map of all permissions in the system
   * @returns Set of all required permission IDs
   */
  getAllRequiredPermissions(
    permission: Permission,
    allPermissions: Map<string, Permission>,
  ): Set<PermissionId> {
    const required = this.resolvePermissionDependencies(
      permission,
      allPermissions,
    );
    required.add(permission.getId());
    return required;
  }

  /**
   * Detects circular dependencies in permission graph
   * @param permission The permission to check
   * @param allPermissions Map of all permissions in the system
   * @returns true if a circular dependency is detected
   */
  detectCircularDependency(
    permission: Permission,
    allPermissions: Map<string, Permission>,
  ): boolean {
    const visited = new Set<string>();
    const recursionStack = new Set<string>();

    return this.hasCycleDFS(
      permission.getId().toString(),
      allPermissions,
      visited,
      recursionStack,
    );
  }

  private hasCycleDFS(
    permissionIdStr: string,
    allPermissions: Map<string, Permission>,
    visited: Set<string>,
    recursionStack: Set<string>,
  ): boolean {
    visited.add(permissionIdStr);
    recursionStack.add(permissionIdStr);

    const permission = allPermissions.get(permissionIdStr);
    if (!permission) {
      recursionStack.delete(permissionIdStr);
      return false;
    }

    for (const parentPermissionId of permission.getParentPermissions()) {
      const parentIdStr = parentPermissionId.toString();

      if (!visited.has(parentIdStr)) {
        if (
          this.hasCycleDFS(parentIdStr, allPermissions, visited, recursionStack)
        ) {
          return true;
        }
      } else if (recursionStack.has(parentIdStr)) {
        return true;
      }
    }

    recursionStack.delete(permissionIdStr);
    return false;
  }

  /**
   * Checks if adding a parent permission would create a circular dependency
   * @param childPermission The permission that would receive the parent
   * @param parentPermissionId The potential parent permission ID
   * @param allPermissions Map of all permissions in the system
   * @returns true if adding the parent would create a cycle
   */
  wouldCreateCycle(
    childPermission: Permission,
    parentPermissionId: PermissionId,
    allPermissions: Map<string, Permission>,
  ): boolean {
    // Create a temporary copy to test
    const testPermission = Permission.reconstitute(
      childPermission.getId(),
      childPermission.getAction(),
      childPermission.getResourceType(),
      childPermission.getTargetId(),
      childPermission.getScope(),
      childPermission.getDescription(),
      childPermission.getCreatedAt(),
      new Set([...childPermission.getParentPermissions(), parentPermissionId]),
    );

    const testPermissions = new Map(allPermissions);
    testPermissions.set(testPermission.getId().toString(), testPermission);

    return this.detectCircularDependency(testPermission, testPermissions);
  }
}

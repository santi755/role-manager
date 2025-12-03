import { Role } from '../Role';
import { RoleId } from '../value-objects/RoleId';
import { PermissionId } from '../value-objects/PermissionId';

export class RoleGraphService {
  /**
   * Detects circular dependencies in the role hierarchy using DFS
   * @param role The role to check
   * @param allRoles Map of all roles in the system
   * @returns true if a circular dependency is detected
   */
  detectCircularDependency(role: Role, allRoles: Map<string, Role>): boolean {
    const visited = new Set<string>();
    const recursionStack = new Set<string>();

    return this.hasCycleDFS(
      role.getId().toString(),
      allRoles,
      visited,
      recursionStack,
    );
  }

  private hasCycleDFS(
    roleIdStr: string,
    allRoles: Map<string, Role>,
    visited: Set<string>,
    recursionStack: Set<string>,
  ): boolean {
    visited.add(roleIdStr);
    recursionStack.add(roleIdStr);

    const role = allRoles.get(roleIdStr);
    if (!role) {
      recursionStack.delete(roleIdStr);
      return false;
    }

    for (const parentRoleId of role.getParentRoles()) {
      const parentIdStr = parentRoleId.toString();

      if (!visited.has(parentIdStr)) {
        if (this.hasCycleDFS(parentIdStr, allRoles, visited, recursionStack)) {
          return true;
        }
      } else if (recursionStack.has(parentIdStr)) {
        return true;
      }
    }

    recursionStack.delete(roleIdStr);
    return false;
  }

  /**
   * Gets all ancestor roles using BFS traversal
   * @param role The starting role
   * @param allRoles Map of all roles in the system
   * @returns Set of all ancestor role IDs
   */
  getAllAncestorRoles(role: Role, allRoles: Map<string, Role>): Set<RoleId> {
    const ancestors = new Set<RoleId>();
    const queue: RoleId[] = Array.from(role.getParentRoles());
    const visited = new Set<string>();

    visited.add(role.getId().toString());

    while (queue.length > 0) {
      const currentRoleId = queue.shift();
      const currentRoleIdStr = currentRoleId.toString();

      if (visited.has(currentRoleIdStr)) {
        continue;
      }

      visited.add(currentRoleIdStr);
      ancestors.add(currentRoleId);

      const currentRole = allRoles.get(currentRoleIdStr);
      if (currentRole) {
        for (const parentRoleId of currentRole.getParentRoles()) {
          if (!visited.has(parentRoleId.toString())) {
            queue.push(parentRoleId);
          }
        }
      }
    }

    return ancestors;
  }

  /**
   * Validates that the role hierarchy is a valid DAG (Directed Acyclic Graph)
   * @param allRoles Map of all roles in the system
   * @returns true if the hierarchy is valid (no cycles)
   */
  validateHierarchyIntegrity(allRoles: Map<string, Role>): boolean {
    for (const role of allRoles.values()) {
      if (this.detectCircularDependency(role, allRoles)) {
        return false;
      }
    }
    return true;
  }

  /**
   * Calculates all effective permissions for a set of roles (including inherited)
   * @param roles Set of roles to calculate permissions for
   * @param allRoles Map of all roles in the system
   * @returns Set of all effective permission IDs
   */
  calculateEffectivePermissions(
    roles: Set<Role>,
    allRoles: Map<string, Role>,
  ): Set<PermissionId> {
    const effectivePermissions = new Set<PermissionId>();

    for (const role of roles) {
      // Add direct permissions
      for (const permissionId of role.getPermissions()) {
        effectivePermissions.add(permissionId);
      }

      // Add inherited permissions from ancestor roles
      const ancestorRoles = this.getAllAncestorRoles(role, allRoles);
      for (const ancestorRoleId of ancestorRoles) {
        const ancestorRole = allRoles.get(ancestorRoleId.toString());
        if (ancestorRole) {
          for (const permissionId of ancestorRole.getPermissions()) {
            effectivePermissions.add(permissionId);
          }
        }
      }
    }

    return effectivePermissions;
  }

  /**
   * Checks if adding a parent role would create a circular dependency
   * @param childRole The role that would receive the parent
   * @param parentRoleId The potential parent role ID
   * @param allRoles Map of all roles in the system
   * @returns true if adding the parent would create a cycle
   */
  wouldCreateCycle(
    childRole: Role,
    parentRoleId: RoleId,
    allRoles: Map<string, Role>,
  ): boolean {
    // Create a temporary copy to test
    const testRole = Role.reconstitute(
      childRole.getId(),
      childRole.getName(),
      childRole.getDescription(),
      childRole.getCreatedAt(),
      new Set([...childRole.getParentRoles(), parentRoleId]),
      new Set(childRole.getPermissions()),
    );

    const testRoles = new Map(allRoles);
    testRoles.set(testRole.getId().toString(), testRole);

    return this.detectCircularDependency(testRole, testRoles);
  }
}

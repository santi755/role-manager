import { Injectable } from '@nestjs/common';
import { Permission } from '../../domain/Permission';
import { PermissionId } from '../../domain/value-objects/PermissionId';
import { Action } from '../../domain/value-objects/Action';
import { Scope } from '../../domain/value-objects/Scope';
import { ResourceType } from '../../domain/value-objects/ResourceType';
import { TargetId } from '../../domain/value-objects/TargetId';
import { PermissionRepository } from '../../domain/repositories/PermissionRepository';

@Injectable()
export class InMemoryPermissionRepository implements PermissionRepository {
  private permissions: Map<string, Permission> = new Map();

  async save(permission: Permission): Promise<void> {
    this.permissions.set(permission.getId().toString(), permission);
  }

  async findById(id: PermissionId): Promise<Permission | null> {
    return this.permissions.get(id.toString()) || null;
  }

  async findByActionScopeResource(
    action: Action,
    resourceType: ResourceType,
    targetId: TargetId,
    scope: Scope | null,
  ): Promise<Permission | null> {
    for (const permission of this.permissions.values()) {
      const scopeMatch =
        (scope === null && permission.getScope() === null) ||
        (scope !== null &&
          permission.getScope() !== null &&
          permission.getScope()!.equals(scope));

      if (
        permission.getAction().equals(action) &&
        permission.getResourceType().equals(resourceType) &&
        permission.getTargetId().equals(targetId) &&
        scopeMatch
      ) {
        return permission;
      }
    }
    return null;
  }

  async findAll(): Promise<Permission[]> {
    return Array.from(this.permissions.values());
  }

  async findByIds(ids: PermissionId[]): Promise<Permission[]> {
    const permissions: Permission[] = [];
    for (const id of ids) {
      const permission = this.permissions.get(id.toString());
      if (permission) {
        permissions.push(permission);
      }
    }
    return permissions;
  }

  async delete(id: PermissionId): Promise<void> {
    this.permissions.delete(id.toString());
  }

  // Helper method for testing
  clear(): void {
    this.permissions.clear();
  }

  // Helper method to get all permissions as a map (for graph operations)
  getAllAsMap(): Map<string, Permission> {
    return new Map(this.permissions);
  }
}

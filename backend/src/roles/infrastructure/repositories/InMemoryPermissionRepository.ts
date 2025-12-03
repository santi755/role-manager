import { Injectable } from '@nestjs/common';
import { Permission } from '../../domain/Permission';
import { PermissionId } from '../../domain/value-objects/PermissionId';
import { ResourceAction } from '../../domain/value-objects/ResourceAction';
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

  async findByResourceAction(
    resourceAction: ResourceAction,
  ): Promise<Permission | null> {
    for (const permission of this.permissions.values()) {
      if (permission.getResourceAction().equals(resourceAction)) {
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

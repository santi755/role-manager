import { Permission } from '../Permission';
import { PermissionId } from '../value-objects/PermissionId';
import { Action } from '../value-objects/Action';
import { Scope } from '../value-objects/Scope';
import { ResourceType } from '../value-objects/ResourceType';
import { TargetId } from '../value-objects/TargetId';

export interface PermissionRepository {
  save(permission: Permission): Promise<void>;
  findById(id: PermissionId): Promise<Permission | null>;
  findByActionScopeResource(
    action: Action,
    resourceType: ResourceType,
    targetId: TargetId,
    scope: Scope | null,
  ): Promise<Permission | null>;
  findAll(): Promise<Permission[]>;
  findByIds(ids: PermissionId[]): Promise<Permission[]>;
  delete(id: PermissionId): Promise<void>;
}

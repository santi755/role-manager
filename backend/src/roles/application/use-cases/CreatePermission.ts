import { Injectable, Inject } from '@nestjs/common';
import { Permission } from '../../domain/Permission';
import { Action } from '../../domain/value-objects/Action';
import { Scope } from '../../domain/value-objects/Scope';
import { ResourceType } from '../../domain/value-objects/ResourceType';
import { TargetId } from '../../domain/value-objects/TargetId';
import type { PermissionRepository } from '../../domain/repositories/PermissionRepository';

export interface CreatePermissionCommand {
  action: string;
  resource_type: string;
  target_id?: string | null;
  scope?: string | null;
  description: string;
}

@Injectable()
export class CreatePermission {
  constructor(
    @Inject('PermissionRepository')
    private readonly permissionRepository: PermissionRepository,
  ) {}

  async execute(command: CreatePermissionCommand): Promise<Permission> {
    const action = Action.fromString(command.action);
    const resourceType = ResourceType.create(command.resource_type);

    // Parse targetId and scope based on mutual exclusivity
    let targetId: TargetId;
    let scope: Scope | null = null;

    if (command.target_id !== undefined && command.target_id !== null) {
      // Case 1 & 2: Specific or Wildcard targetId
      targetId = TargetId.fromString(command.target_id);
    } else if (command.scope) {
      // Case 3: Dynamic scope
      targetId = TargetId.none();
      scope = Scope.fromString(command.scope);
    } else {
      throw new Error(
        'Either target_id or scope must be provided (they are mutually exclusive)',
      );
    }

    // Check if permission already exists
    const existingPermission =
      await this.permissionRepository.findByActionScopeResource(
        action,
        resourceType,
        targetId,
        scope,
      );
    if (existingPermission) {
      throw new Error(
        `Permission ${action.toString()}:${resourceType.toString()}:${targetId.toString()}${scope ? ':' + scope.toString() : ''} already exists`,
      );
    }

    const permission = Permission.create(
      action,
      resourceType,
      targetId,
      scope,
      command.description,
    );

    await this.permissionRepository.save(permission);

    return permission;
  }
}

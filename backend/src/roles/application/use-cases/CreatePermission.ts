import { Injectable, Inject } from '@nestjs/common';
import { Permission } from '../../domain/Permission';
import { Action } from '../../domain/value-objects/Action';
import { Scope, ScopeData } from '../../domain/value-objects/Scope';
import { Resource } from '../../domain/value-objects/Resource';
import type { PermissionRepository } from '../../domain/repositories/PermissionRepository';

export interface CreatePermissionCommand {
  action: string;
  scope: ScopeData;
  resource: string;
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
    const scope = Scope.fromData(command.scope);
    const resource = Resource.create(command.resource);

    // Check if permission already exists
    const existingPermission =
      await this.permissionRepository.findByActionScopeResource(
        action,
        scope,
        resource,
      );
    if (existingPermission) {
      throw new Error(
        `Permission ${action.toString()}:${scope.toString()}:${resource.toString()} already exists`,
      );
    }

    const permission = Permission.create(action, scope, resource, command.description);

    await this.permissionRepository.save(permission);

    return permission;
  }
}

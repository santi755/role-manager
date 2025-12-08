import { Injectable, Inject, NotFoundException } from '@nestjs/common';
import type { PermissionRepository } from '../../domain/repositories/PermissionRepository';
import { PermissionId } from '../../domain/value-objects/PermissionId';
import { Action } from '../../domain/value-objects/Action';
import { ResourceType } from '../../domain/value-objects/ResourceType';
import { TargetId } from '../../domain/value-objects/TargetId';
import { Scope } from '../../domain/value-objects/Scope';
import { UpdatePermissionDto } from '../dto/UpdatePermissionDto';
import { Permission } from '../../domain/Permission';

@Injectable()
export class UpdatePermission {
  constructor(
    @Inject('PermissionRepository')
    private readonly permissionRepository: PermissionRepository,
  ) {}

  async execute(id: string, dto: UpdatePermissionDto): Promise<Permission> {
    const permissionId = PermissionId.fromString(id);
    const existingPermission = await this.permissionRepository.findById(permissionId);

    if (!existingPermission) {
      throw new NotFoundException(`Permission with ID ${id} not found`);
    }

    // Determine new values or keep existing
    const action = dto.action
      ? Action.create(dto.action)
      : existingPermission.getAction();
    
    const resourceType = dto.resource_type
      ? ResourceType.create(dto.resource_type)
      : existingPermission.getResourceType();
    
    let targetId = existingPermission.getTargetId();
    let scope = existingPermission.getScope();

    if (dto.target_id !== undefined) {
      if (dto.target_id === null) {
        targetId = TargetId.none();
      } else if (dto.target_id === '*') {
        targetId = TargetId.wildcard();
      } else {
        targetId = TargetId.specific(dto.target_id);
      }

      if (!targetId.isNone()) {
          scope = null; // targetId implies no scope
      }
    }

    if (dto.scope !== undefined) {
      scope = dto.scope === null ? null : Scope.fromString(dto.scope);
      if (scope) {
          targetId = TargetId.none(); // scope implies no targetId
      }
    }
    
    const description =
      dto.description !== undefined
        ? dto.description
        : existingPermission.getDescription();

    // Reconstitute with new values
    const updatedPermission = Permission.reconstitute(
      existingPermission.getId(),
      action,
      resourceType,
      targetId,
      scope,
      description,
      existingPermission.getCreatedAt(),
      new Set(existingPermission.getParentPermissions()),
    );

    // Save (Update)
    await this.permissionRepository.save(updatedPermission);

    return updatedPermission;
  }
}

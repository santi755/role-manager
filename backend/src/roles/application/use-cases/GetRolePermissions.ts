import { Injectable, Inject } from '@nestjs/common';
import type { RoleRepository } from '../../domain/repositories/RoleRepository';
import type { PermissionRepository } from '../../domain/repositories/PermissionRepository';
import { RoleId } from '../../domain/value-objects/RoleId';
import { RoleGraphService } from '../../domain/services/RoleGraphService';
import { PermissionDto } from '../dto/PermissionDto';

export interface GetRolePermissionsQuery {
  roleId: string;
}

@Injectable()
export class GetRolePermissions {
  constructor(
    @Inject('RoleRepository')
    private readonly roleRepository: RoleRepository,
    @Inject('PermissionRepository')
    private readonly permissionRepository: PermissionRepository,
    private readonly roleGraphService: RoleGraphService,
  ) {}

  async execute(query: GetRolePermissionsQuery): Promise<PermissionDto[]> {
    const roleId = RoleId.fromString(query.roleId);
    const role = await this.roleRepository.findById(roleId);

    if (!role) {
      throw new Error(`Role with id ${query.roleId} not found`);
    }

    // Get all roles for graph traversal
    const allRoles = await this.roleRepository.findAll();
    const rolesMap = new Map(allRoles.map((r) => [r.getId().toString(), r]));

    // Calculate effective permissions (including inherited)
    const effectivePermissionIds =
      this.roleGraphService.calculateEffectivePermissions(
        new Set([role]),
        rolesMap,
      );

    // Fetch all permissions
    const permissions = await this.permissionRepository.findByIds(
      Array.from(effectivePermissionIds),
    );

    return permissions.map((permission) => ({
      id: permission.getId().toString(),
      action: permission.getAction().toString(),
      resource_type: permission.getResourceType().toString(),
      target_id: permission.getTargetId().toJSON(),
      scope: permission.getScope()?.toString() ?? null,
      description: permission.getDescription(),
      createdAt: permission.getCreatedAt(),
      parentPermissions: Array.from(permission.getParentPermissions()).map(
        (id) => id.toString(),
      ),
    }));
  }
}

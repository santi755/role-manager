import { Injectable, Inject } from '@nestjs/common';
import type { RoleRepository } from '../../domain/repositories/RoleRepository';
import type { PermissionRepository } from '../../domain/repositories/PermissionRepository';
import { RoleId } from '../../domain/value-objects/RoleId';
import { PermissionId } from '../../domain/value-objects/PermissionId';

export interface GrantPermissionToRoleCommand {
  roleId: string;
  permissionId: string;
}

@Injectable()
export class GrantPermissionToRole {
  constructor(
    @Inject('RoleRepository')
    private readonly roleRepository: RoleRepository,
    @Inject('PermissionRepository')
    private readonly permissionRepository: PermissionRepository,
  ) {}

  async execute(command: GrantPermissionToRoleCommand): Promise<void> {
    const roleId = RoleId.fromString(command.roleId);
    const permissionId = PermissionId.fromString(command.permissionId);

    const role = await this.roleRepository.findById(roleId);
    if (!role) {
      throw new Error(`Role with id ${command.roleId} not found`);
    }

    const permission = await this.permissionRepository.findById(permissionId);
    if (!permission) {
      throw new Error(`Permission with id ${command.permissionId} not found`);
    }

    role.grantPermission(permissionId);

    await this.roleRepository.save(role);
  }
}

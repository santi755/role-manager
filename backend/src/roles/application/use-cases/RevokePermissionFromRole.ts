import { Injectable, Inject } from '@nestjs/common';
import type { RoleRepository } from '../../domain/repositories/RoleRepository';
import { RoleId } from '../../domain/value-objects/RoleId';
import { PermissionId } from '../../domain/value-objects/PermissionId';

export interface RevokePermissionFromRoleCommand {
    roleId: string;
    permissionId: string;
}

@Injectable()
export class RevokePermissionFromRole {
    constructor(
        @Inject('RoleRepository')
        private readonly roleRepository: RoleRepository,
    ) { }

    async execute(command: RevokePermissionFromRoleCommand): Promise<void> {
        const roleId = RoleId.fromString(command.roleId);
        const permissionId = PermissionId.fromString(command.permissionId);

        const role = await this.roleRepository.findById(roleId);
        if (!role) {
            throw new Error(`Role with id ${command.roleId} not found`);
        }

        // Check if role has this permission
        if (!role.getPermissions().has(permissionId)) {
            throw new Error(
                `Role does not have permission ${command.permissionId}`,
            );
        }

        role.revokePermission(permissionId);

        await this.roleRepository.save(role);
    }
}

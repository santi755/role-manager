import { Injectable, Inject } from '@nestjs/common';
import type { RoleRepository } from '../../domain/repositories/RoleRepository';
import { RoleId } from '../../domain/value-objects/RoleId';
import { RoleGraphService } from '../../domain/services/RoleGraphService';

export interface SetRoleParentCommand {
    roleId: string;
    parentRoleId: string;
}

@Injectable()
export class SetRoleParent {
    constructor(
        @Inject('RoleRepository')
        private readonly roleRepository: RoleRepository,
        private readonly roleGraphService: RoleGraphService,
    ) { }

    async execute(command: SetRoleParentCommand): Promise<void> {
        const roleId = RoleId.fromString(command.roleId);
        const parentRoleId = RoleId.fromString(command.parentRoleId);

        const role = await this.roleRepository.findById(roleId);
        if (!role) {
            throw new Error(`Role with id ${command.roleId} not found`);
        }

        const parentRole = await this.roleRepository.findById(parentRoleId);
        if (!parentRole) {
            throw new Error(`Parent role with id ${command.parentRoleId} not found`);
        }

        // Get all roles for cycle detection
        const allRoles = await this.roleRepository.findAll();
        const rolesMap = new Map(allRoles.map((r) => [r.getId().toString(), r]));

        // Check if adding this parent would create a circular dependency
        if (this.roleGraphService.wouldCreateCycle(role, parentRoleId, rolesMap)) {
            throw new Error(
                'Cannot set parent role: would create circular dependency in role hierarchy',
            );
        }

        role.addParentRole(parentRoleId);

        await this.roleRepository.save(role);
    }
}

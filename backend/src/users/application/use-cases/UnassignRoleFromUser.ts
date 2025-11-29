import { Injectable, Inject } from '@nestjs/common';
import type { UserRepository } from '../../domain/repositories/UserRepository';
import type { RoleRepository } from '../../../roles/domain/repositories/RoleRepository';
import { UserId } from '../../domain/value-objects/UserId';
import { RoleId } from '../../../roles/domain/value-objects/RoleId';

export interface UnassignRoleFromUserCommand {
    userId: string;
    roleId: string;
}

@Injectable()
export class UnassignRoleFromUser {
    constructor(
        @Inject('UserRepository')
        private readonly userRepository: UserRepository,
        @Inject('RoleRepository')
        private readonly roleRepository: RoleRepository,
    ) { }

    async execute(command: UnassignRoleFromUserCommand): Promise<void> {
        const userId = UserId.fromString(command.userId);
        const roleId = RoleId.fromString(command.roleId);

        const user = await this.userRepository.findById(userId);
        if (!user) {
            throw new Error(`User with id ${command.userId} not found`);
        }

        const role = await this.roleRepository.findById(roleId);
        if (!role) {
            throw new Error(`Role with id ${command.roleId} not found`);
        }

        // Check if user has this role
        if (!user.getAssignedRoles().has(roleId)) {
            throw new Error(`User does not have role ${command.roleId}`);
        }

        user.unassignRole(roleId);

        await this.userRepository.save(user);
    }
}

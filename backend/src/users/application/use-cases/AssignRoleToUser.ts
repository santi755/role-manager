import { Injectable, Inject } from '@nestjs/common';
import type { UserRepository } from '../../domain/repositories/UserRepository';
import type { RoleRepository } from '../../../roles/domain/repositories/RoleRepository';
import { UserId } from '../../domain/value-objects/UserId';
import { RoleId } from '../../../roles/domain/value-objects/RoleId';

export interface AssignRoleToUserCommand {
    userId: string;
    roleId: string;
}

@Injectable()
export class AssignRoleToUser {
    constructor(
        @Inject('UserRepository')
        private readonly userRepository: UserRepository,
        @Inject('RoleRepository')
        private readonly roleRepository: RoleRepository,
    ) { }

    async execute(command: AssignRoleToUserCommand): Promise<void> {
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

        user.assignRole(roleId);

        await this.userRepository.save(user);
    }
}

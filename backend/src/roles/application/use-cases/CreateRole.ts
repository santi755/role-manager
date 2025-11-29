import { Injectable, Inject } from '@nestjs/common';
import { Role } from '../../domain/Role';
import type { RoleRepository } from '../../domain/repositories/RoleRepository';

export interface CreateRoleCommand {
    name: string;
    description: string;
}

@Injectable()
export class CreateRole {
    constructor(
        @Inject('RoleRepository')
        private readonly roleRepository: RoleRepository,
    ) { }

    async execute(command: CreateRoleCommand): Promise<Role> {
        // Check if role already exists
        const existingRole = await this.roleRepository.findByName(command.name);
        if (existingRole) {
            throw new Error(`Role with name ${command.name} already exists`);
        }

        const role = Role.create(command.name, command.description);

        await this.roleRepository.save(role);

        return role;
    }
}

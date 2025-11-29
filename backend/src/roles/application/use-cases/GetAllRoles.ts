import { Injectable, Inject } from '@nestjs/common';
import type { RoleRepository } from '../../domain/repositories/RoleRepository';
import { RoleDto } from '../dto/RoleDto';

@Injectable()
export class GetAllRoles {
    constructor(
        @Inject('RoleRepository')
        private readonly roleRepository: RoleRepository,
    ) { }

    async execute(): Promise<RoleDto[]> {
        const roles = await this.roleRepository.findAll();

        return roles.map((role) => ({
            id: role.getId().toString(),
            name: role.getName(),
            description: role.getDescription(),
            createdAt: role.getCreatedAt(),
            parentRoles: Array.from(role.getParentRoles()).map((r) =>
                r.toString(),
            ),
            permissions: Array.from(role.getPermissions()).map((p) =>
                p.toString(),
            ),
        }));
    }
}

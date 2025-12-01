import { Injectable, Inject } from '@nestjs/common';
import type { UserRepository } from '../../domain/repositories/UserRepository';
import type { RoleRepository } from '../../../roles/domain/repositories/RoleRepository';
import type { PermissionRepository } from '../../../roles/domain/repositories/PermissionRepository';
import { UserId } from '../../domain/value-objects/UserId';
import { RoleGraphService } from '../../../roles/domain/services/RoleGraphService';
import { PermissionDto } from '../../../roles/application/dto/PermissionDto';

export interface GetUserPermissionsQuery {
    userId: string;
}

@Injectable()
export class GetUserPermissions {
    constructor(
        @Inject('UserRepository')
        private readonly userRepository: UserRepository,
        @Inject('RoleRepository')
        private readonly roleRepository: RoleRepository,
        @Inject('PermissionRepository')
        private readonly permissionRepository: PermissionRepository,
        private readonly roleGraphService: RoleGraphService,
    ) { }

    async execute(query: GetUserPermissionsQuery): Promise<PermissionDto[]> {
        const userId = UserId.fromString(query.userId);
        const user = await this.userRepository.findById(userId);

        if (!user) {
            throw new Error(`User with id ${query.userId} not found`);
        }

        // Get all user roles
        const userRoles = await this.roleRepository.findByIds(
            Array.from(user.getAssignedRoles()),
        );

        if (userRoles.length === 0) {
            return [];
        }

        // Get all roles for graph traversal
        const allRoles = await this.roleRepository.findAll();
        const rolesMap = new Map(allRoles.map((r) => [r.getId().toString(), r]));

        // Calculate effective permissions from roles (including inherited)
        const effectivePermissionIds =
            this.roleGraphService.calculateEffectivePermissions(
                new Set(userRoles),
                rolesMap,
            );

        // Fetch all permissions
        const permissions = await this.permissionRepository.findByIds(
            Array.from(effectivePermissionIds),
        );

        return permissions.map((permission) => ({
            id: permission.getId().toString(),
            resource: permission.getResourceAction().getResource(),
            action: permission.getResourceAction().getAction(),
            description: permission.getDescription(),
            createdAt: permission.getCreatedAt(),
            parentPermissions: Array.from(permission.getParentPermissions()).map((id) =>
                id.toString(),
            ),
        }));
    }
}

import { Injectable, Inject } from '@nestjs/common';
import type { PermissionRepository } from '../../domain/repositories/PermissionRepository';
import { PermissionId } from '../../domain/value-objects/PermissionId';
import { PermissionDto } from '../dto/PermissionDto';

export interface GetPermissionByIdQuery {
    permissionId: string;
}

@Injectable()
export class GetPermissionById {
    constructor(
        @Inject('PermissionRepository')
        private readonly permissionRepository: PermissionRepository,
    ) { }

    async execute(query: GetPermissionByIdQuery): Promise<PermissionDto> {
        const permissionId = PermissionId.fromString(query.permissionId);
        const permission = await this.permissionRepository.findById(permissionId);

        if (!permission) {
            throw new Error(`Permission with id ${query.permissionId} not found`);
        }

        return {
            id: permission.getId().toString(),
            resource: permission.getResourceAction().getResource(),
            action: permission.getResourceAction().getAction(),
            description: permission.getDescription(),
            createdAt: permission.getCreatedAt(),
            parentPermissions: Array.from(permission.getParentPermissions()).map((id) =>
                id.toString(),
            ),
        };
    }
}

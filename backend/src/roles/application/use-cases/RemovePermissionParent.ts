import { Injectable, Inject } from '@nestjs/common';
import type { PermissionRepository } from '../../domain/repositories/PermissionRepository';
import { PermissionId } from '../../domain/value-objects/PermissionId';

export interface RemovePermissionParentCommand {
    permissionId: string;
    parentPermissionId: string;
}

@Injectable()
export class RemovePermissionParent {
    constructor(
        @Inject('PermissionRepository')
        private readonly permissionRepository: PermissionRepository,
    ) { }

    async execute(command: RemovePermissionParentCommand): Promise<void> {
        const permissionId = PermissionId.fromString(command.permissionId);
        const parentPermissionId = PermissionId.fromString(command.parentPermissionId);

        const permission = await this.permissionRepository.findById(permissionId);
        if (!permission) {
            throw new Error(`Permission with id ${command.permissionId} not found`);
        }

        const parentPermission = await this.permissionRepository.findById(parentPermissionId);
        if (!parentPermission) {
            throw new Error(`Parent permission with id ${command.parentPermissionId} not found`);
        }

        // Check if permission has this parent
        if (!permission.hasParentPermission(parentPermissionId)) {
            throw new Error(
                `Permission does not have parent permission ${command.parentPermissionId}`,
            );
        }

        permission.removeParentPermission(parentPermissionId);

        await this.permissionRepository.save(permission);
    }
}

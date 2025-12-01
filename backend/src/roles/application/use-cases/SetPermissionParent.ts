import { Injectable, Inject } from '@nestjs/common';
import type { PermissionRepository } from '../../domain/repositories/PermissionRepository';
import { PermissionId } from '../../domain/value-objects/PermissionId';
import { PermissionGraphService } from '../../domain/services/PermissionGraphService';

export interface SetPermissionParentCommand {
    permissionId: string;
    parentPermissionId: string;
}

@Injectable()
export class SetPermissionParent {
    constructor(
        @Inject('PermissionRepository')
        private readonly permissionRepository: PermissionRepository,
        private readonly permissionGraphService: PermissionGraphService,
    ) { }

    async execute(command: SetPermissionParentCommand): Promise<void> {
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

        // Get all permissions for cycle detection
        const allPermissions = await this.permissionRepository.findAll();
        const permissionsMap = new Map(allPermissions.map((p) => [p.getId().toString(), p]));

        // Check if adding this parent would create a circular dependency
        if (this.permissionGraphService.wouldCreateCycle(permission, parentPermissionId, permissionsMap)) {
            throw new Error(
                'Cannot set parent permission: would create circular dependency in permission hierarchy',
            );
        }

        permission.addParentPermission(parentPermissionId);

        await this.permissionRepository.save(permission);
    }
}

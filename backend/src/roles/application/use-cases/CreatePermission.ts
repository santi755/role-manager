import { Injectable, Inject } from '@nestjs/common';
import { Permission } from '../../domain/Permission';
import { ResourceAction } from '../../domain/value-objects/ResourceAction';
import type { PermissionRepository } from '../../domain/repositories/PermissionRepository';

export interface CreatePermissionCommand {
    resource: string;
    action: string;
    description: string;
}

@Injectable()
export class CreatePermission {
    constructor(
        @Inject('PermissionRepository')
        private readonly permissionRepository: PermissionRepository,
    ) { }

    async execute(command: CreatePermissionCommand): Promise<Permission> {
        const resourceAction = ResourceAction.create(
            command.resource,
            command.action,
        );

        // Check if permission already exists
        const existingPermission =
            await this.permissionRepository.findByResourceAction(resourceAction);
        if (existingPermission) {
            throw new Error(
                `Permission ${resourceAction.toString()} already exists`,
            );
        }

        const permission = Permission.create(resourceAction, command.description);

        await this.permissionRepository.save(permission);

        return permission;
    }
}

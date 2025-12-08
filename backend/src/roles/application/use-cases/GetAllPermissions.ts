import { Injectable, Inject } from '@nestjs/common';
import type { PermissionRepository } from '../../domain/repositories/PermissionRepository';
import { PermissionDto } from '../dto/PermissionDto';

export interface GetAllPermissionsQuery {
  resource?: string;
}

@Injectable()
export class GetAllPermissions {
  constructor(
    @Inject('PermissionRepository')
    private readonly permissionRepository: PermissionRepository,
  ) {}

  async execute(query?: GetAllPermissionsQuery): Promise<PermissionDto[]> {
    const permissions = await this.permissionRepository.findAll();

    const filteredPermissions = query?.resource
      ? permissions.filter(
          (p) => p.getResource().toString() === query.resource,
        )
      : permissions;

    return filteredPermissions.map((permission) => ({
      id: permission.getId().toString(),
      action: permission.getAction().toString(),
      scope: permission.getScope().toData(),
      resource: permission.getResource().toString(),
      description: permission.getDescription(),
      createdAt: permission.getCreatedAt(),
      parentPermissions: Array.from(permission.getParentPermissions()).map(
        (id) => id.toString(),
      ),
    }));
  }
}

import { Injectable, Inject, Logger } from '@nestjs/common';
import type { PermissionRepository } from '../../domain/repositories/PermissionRepository';
import { PermissionDto } from '../dto/PermissionDto';

export interface GetAllPermissionsQuery {
  resource_type?: string;
}

@Injectable()
export class GetAllPermissions {
  private readonly logger = new Logger(GetAllPermissions.name);

  constructor(
    @Inject('PermissionRepository')
    private readonly permissionRepository: PermissionRepository,
  ) {}

  async execute(query?: GetAllPermissionsQuery): Promise<PermissionDto[]> {
    try {
      this.logger.log('Fetching all permissions...');
      const permissions = await this.permissionRepository.findAll();
      this.logger.log(`Found ${permissions.length} permissions`);

      const filteredPermissions = query?.resource_type
        ? permissions.filter(
            (p) => p.getResourceType().toString() === query.resource_type,
          )
        : permissions;

      this.logger.log(
        `Mapping ${filteredPermissions.length} permissions to DTOs`,
      );

      return filteredPermissions.map((permission, index) => {
        try {
          return {
            id: permission.getId().toString(),
            action: permission.getAction().toString(),
            resource_type: permission.getResourceType().toString(),
            target_id: permission.getTargetId().toJSON(),
            scope: permission.getScope()?.toString() ?? null,
            description: permission.getDescription(),
            createdAt: permission.getCreatedAt(),
            parentPermissions: Array.from(
              permission.getParentPermissions(),
            ).map((id) => id.toString()),
          };
        } catch (mappingError) {
          this.logger.error(
            `Error mapping permission at index ${index}: ${mappingError.message}`,
            mappingError.stack,
          );
          throw mappingError;
        }
      });
    } catch (error) {
      this.logger.error(
        `Error in GetAllPermissions: ${error.message}`,
        error.stack,
      );
      throw error;
    }
  }
}

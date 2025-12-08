import { Injectable, Inject, Logger } from '@nestjs/common';
import type { PermissionRepository } from '../../domain/repositories/PermissionRepository';
import { PermissionDto } from '../dto/PermissionDto';

export interface GetAllPermissionsQuery {
  resource_type?: string;
  action?: string;
  scope?: string;
  target_type?: 'specific' | 'wildcard' | 'none';
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

      // Apply filters
      let filteredPermissions = permissions;

      if (query?.resource_type) {
        filteredPermissions = filteredPermissions.filter(
          (p) => p.getResourceType().toString() === query.resource_type,
        );
      }

      if (query?.action) {
        filteredPermissions = filteredPermissions.filter(
          (p) => p.getAction().toString() === query.action,
        );
      }

      if (query?.scope) {
        filteredPermissions = filteredPermissions.filter(
          (p) => p.getScope()?.toString() === query.scope,
        );
      }

      if (query?.target_type) {
        filteredPermissions = filteredPermissions.filter((p) => {
          const targetId = p.getTargetId();
          switch (query.target_type) {
            case 'specific':
              return targetId.isSpecific();
            case 'wildcard':
              return targetId.isWildcard();
            case 'none':
              return targetId.isNone();
            default:
              return true;
          }
        });
      }

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

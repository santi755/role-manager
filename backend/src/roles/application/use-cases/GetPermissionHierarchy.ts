import { Injectable, Inject } from '@nestjs/common';
import type { PermissionRepository } from '../../domain/repositories/PermissionRepository';
import { PermissionId } from '../../domain/value-objects/PermissionId';
import { PermissionGraphService } from '../../domain/services/PermissionGraphService';
import { PermissionHierarchyDto } from '../dto/PermissionHierarchyDto';
import { PermissionDto } from '../dto/PermissionDto';

export interface GetPermissionHierarchyQuery {
  permissionId: string;
}

@Injectable()
export class GetPermissionHierarchy {
  constructor(
    @Inject('PermissionRepository')
    private readonly permissionRepository: PermissionRepository,
    private readonly permissionGraphService: PermissionGraphService,
  ) {}

  async execute(
    query: GetPermissionHierarchyQuery,
  ): Promise<PermissionHierarchyDto> {
    const permissionId = PermissionId.fromString(query.permissionId);
    const permission = await this.permissionRepository.findById(permissionId);

    if (!permission) {
      throw new Error(`Permission with id ${query.permissionId} not found`);
    }

    // Get all permissions for graph traversal
    const allPermissions = await this.permissionRepository.findAll();
    const permissionsMap = new Map(
      allPermissions.map((p) => [p.getId().toString(), p]),
    );

    // Get ancestors (parent permissions recursively)
    const ancestorIds =
      this.permissionGraphService.resolvePermissionDependencies(
        permission,
        permissionsMap,
      );
    const ancestors = await this.permissionRepository.findByIds(
      Array.from(ancestorIds),
    );

    // Get descendants (child permissions recursively)
    const descendants: PermissionDto[] = [];
    for (const [, potentialChild] of permissionsMap) {
      const childAncestors =
        this.permissionGraphService.resolvePermissionDependencies(
          potentialChild,
          permissionsMap,
        );
      if (
        Array.from(childAncestors).some(
          (ancestorId) => ancestorId.toString() === permissionId.toString(),
        )
      ) {
        descendants.push({
          id: potentialChild.getId().toString(),
          action: potentialChild.getAction().toString(),
          scope: potentialChild.getScope().toData(),
          resource: potentialChild.getResource().toString(),
          description: potentialChild.getDescription(),
          createdAt: potentialChild.getCreatedAt(),
          parentPermissions: Array.from(
            potentialChild.getParentPermissions(),
          ).map((id) => id.toString()),
        });
      }
    }

    return {
      permission: {
        id: permission.getId().toString(),
        action: permission.getAction().toString(),
        scope: permission.getScope().toData(),
        resource: permission.getResource().toString(),
        description: permission.getDescription(),
        createdAt: permission.getCreatedAt(),
        parentPermissions: Array.from(permission.getParentPermissions()).map(
          (id) => id.toString(),
        ),
      },
      ancestors: ancestors.map((ancestor) => ({
        id: ancestor.getId().toString(),
        action: ancestor.getAction().toString(),
        scope: ancestor.getScope().toData(),
        resource: ancestor.getResource().toString(),
        description: ancestor.getDescription(),
        createdAt: ancestor.getCreatedAt(),
        parentPermissions: Array.from(ancestor.getParentPermissions()).map(
          (id) => id.toString(),
        ),
      })),
      descendants: descendants,
    };
  }
}

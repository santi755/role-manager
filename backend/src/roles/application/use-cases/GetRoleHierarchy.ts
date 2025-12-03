import { Injectable, Inject } from '@nestjs/common';
import type { RoleRepository } from '../../domain/repositories/RoleRepository';
import { RoleId } from '../../domain/value-objects/RoleId';
import { RoleGraphService } from '../../domain/services/RoleGraphService';
import { RoleHierarchyDto } from '../dto/RoleHierarchyDto';
import { RoleDto } from '../dto/RoleDto';

export interface GetRoleHierarchyQuery {
  roleId: string;
}

@Injectable()
export class GetRoleHierarchy {
  constructor(
    @Inject('RoleRepository')
    private readonly roleRepository: RoleRepository,
    private readonly roleGraphService: RoleGraphService,
  ) {}

  async execute(query: GetRoleHierarchyQuery): Promise<RoleHierarchyDto> {
    const roleId = RoleId.fromString(query.roleId);
    const role = await this.roleRepository.findById(roleId);

    if (!role) {
      throw new Error(`Role with id ${query.roleId} not found`);
    }

    // Get all roles for graph traversal
    const allRoles = await this.roleRepository.findAll();
    const rolesMap = new Map(allRoles.map((r) => [r.getId().toString(), r]));

    // Get ancestors (parent roles recursively)
    const ancestorIds = this.roleGraphService.getAllAncestorRoles(
      role,
      rolesMap,
    );
    const ancestors = await this.roleRepository.findByIds(
      Array.from(ancestorIds),
    );

    // Get descendants (child roles recursively)
    const descendants: RoleDto[] = [];
    for (const [, potentialChild] of rolesMap) {
      const childAncestors = this.roleGraphService.getAllAncestorRoles(
        potentialChild,
        rolesMap,
      );
      if (
        Array.from(childAncestors).some(
          (ancestorId) => ancestorId.toString() === roleId.toString(),
        )
      ) {
        descendants.push({
          id: potentialChild.getId().toString(),
          name: potentialChild.getName(),
          description: potentialChild.getDescription(),
          createdAt: potentialChild.getCreatedAt(),
          parentRoles: Array.from(potentialChild.getParentRoles()).map((r) =>
            r.toString(),
          ),
          permissions: Array.from(potentialChild.getPermissions()).map((p) =>
            p.toString(),
          ),
        });
      }
    }

    return {
      role: {
        id: role.getId().toString(),
        name: role.getName(),
        description: role.getDescription(),
        createdAt: role.getCreatedAt(),
        parentRoles: Array.from(role.getParentRoles()).map((r) => r.toString()),
        permissions: Array.from(role.getPermissions()).map((p) => p.toString()),
      },
      ancestors: ancestors.map((ancestor) => ({
        id: ancestor.getId().toString(),
        name: ancestor.getName(),
        description: ancestor.getDescription(),
        createdAt: ancestor.getCreatedAt(),
        parentRoles: Array.from(ancestor.getParentRoles()).map((r) =>
          r.toString(),
        ),
        permissions: Array.from(ancestor.getPermissions()).map((p) =>
          p.toString(),
        ),
      })),
      descendants,
    };
  }
}

import { Injectable, Inject } from '@nestjs/common';
import type { RoleRepository } from '../../domain/repositories/RoleRepository';
import { RoleId } from '../../domain/value-objects/RoleId';
import { RoleDto } from '../dto/RoleDto';

export interface GetRoleByIdQuery {
  roleId: string;
}

@Injectable()
export class GetRoleById {
  constructor(
    @Inject('RoleRepository')
    private readonly roleRepository: RoleRepository,
  ) {}

  async execute(query: GetRoleByIdQuery): Promise<RoleDto> {
    const roleId = RoleId.fromString(query.roleId);
    const role = await this.roleRepository.findById(roleId);

    if (!role) {
      throw new Error(`Role with id ${query.roleId} not found`);
    }

    return {
      id: role.getId().toString(),
      name: role.getName(),
      description: role.getDescription(),
      createdAt: role.getCreatedAt(),
      parentRoles: Array.from(role.getParentRoles()).map((r) => r.toString()),
      permissions: Array.from(role.getPermissions()).map((p) => p.toString()),
    };
  }
}

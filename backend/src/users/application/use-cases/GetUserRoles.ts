import { Injectable, Inject } from '@nestjs/common';
import type { UserRepository } from '../../domain/repositories/UserRepository';
import type { RoleRepository } from '../../../roles/domain/repositories/RoleRepository';
import { UserId } from '../../domain/value-objects/UserId';
import { RoleDto } from '../../../roles/application/dto/RoleDto';

export interface GetUserRolesQuery {
  userId: string;
}

@Injectable()
export class GetUserRoles {
  constructor(
    @Inject('UserRepository')
    private readonly userRepository: UserRepository,
    @Inject('RoleRepository')
    private readonly roleRepository: RoleRepository,
  ) {}

  async execute(query: GetUserRolesQuery): Promise<RoleDto[]> {
    const userId = UserId.fromString(query.userId);
    const user = await this.userRepository.findById(userId);

    if (!user) {
      throw new Error(`User with id ${query.userId} not found`);
    }

    const roles = await this.roleRepository.findByIds(
      Array.from(user.getAssignedRoles()),
    );

    return roles.map((role) => ({
      id: role.getId().toString(),
      name: role.getName(),
      description: role.getDescription(),
      createdAt: role.getCreatedAt(),
      parentRoles: Array.from(role.getParentRoles()).map((r) => r.toString()),
      permissions: Array.from(role.getPermissions()).map((p) => p.toString()),
    }));
  }
}

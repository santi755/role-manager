import { Injectable, Inject } from '@nestjs/common';
import type { UserRepository } from '../../domain/repositories/UserRepository';
import type { RoleRepository } from '../../../roles/domain/repositories/RoleRepository';
import { UserId } from '../../domain/value-objects/UserId';
import { RoleId } from '../../../roles/domain/value-objects/RoleId';

export interface SyncUserRolesCommand {
  userId: string;
  roleIds: string[];
}

@Injectable()
export class SyncUserRoles {
  constructor(
    @Inject('UserRepository')
    private readonly userRepository: UserRepository,
    @Inject('RoleRepository')
    private readonly roleRepository: RoleRepository,
  ) {}

  async execute(command: SyncUserRolesCommand): Promise<void> {
    const userId = UserId.fromString(command.userId);
    const roleIds = command.roleIds.map((id) => RoleId.fromString(id));

    const user = await this.userRepository.findById(userId);
    if (!user) {
      throw new Error(`User with id ${command.userId} not found`);
    }

    // Validate all roles exist
    for (const roleId of roleIds) {
      const role = await this.roleRepository.findById(roleId);
      if (!role) {
        throw new Error(`Role with id ${roleId.toString()} not found`);
      }
    }

    user.syncRoles(roleIds);

    await this.userRepository.save(user);
  }
}

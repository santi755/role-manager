import { Injectable, Inject } from '@nestjs/common';
import type { RoleRepository } from '../../domain/repositories/RoleRepository';
import { RoleId } from '../../domain/value-objects/RoleId';

export interface RemoveRoleParentCommand {
  roleId: string;
  parentRoleId: string;
}

@Injectable()
export class RemoveRoleParent {
  constructor(
    @Inject('RoleRepository')
    private readonly roleRepository: RoleRepository,
  ) {}

  async execute(command: RemoveRoleParentCommand): Promise<void> {
    const roleId = RoleId.fromString(command.roleId);
    const parentRoleId = RoleId.fromString(command.parentRoleId);

    const role = await this.roleRepository.findById(roleId);
    if (!role) {
      throw new Error(`Role with id ${command.roleId} not found`);
    }

    const parentRole = await this.roleRepository.findById(parentRoleId);
    if (!parentRole) {
      throw new Error(`Parent role with id ${command.parentRoleId} not found`);
    }

    // Check if role has this parent
    if (!role.hasParentRole(parentRoleId)) {
      throw new Error(`Role does not have parent role ${command.parentRoleId}`);
    }

    role.removeParentRole(parentRoleId);

    await this.roleRepository.save(role);
  }
}

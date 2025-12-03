import { Injectable, Inject } from '@nestjs/common';
import { RoleId } from '../../domain/value-objects/RoleId';
import type { RoleRepository } from '../../domain/repositories/RoleRepository';

export interface DeleteRoleCommand {
  roleId: string;
}

@Injectable()
export class DeleteRole {
  constructor(
    @Inject('RoleRepository')
    private readonly roleRepository: RoleRepository,
  ) {}

  async execute(command: DeleteRoleCommand): Promise<void> {
    const roleId = RoleId.fromString(command.roleId);
    const role = await this.roleRepository.findById(roleId);

    if (!role) {
      throw new Error(`Role with id ${command.roleId} not found`);
    }

    const allRoles = await this.roleRepository.findAll();
    for (const otherRole of allRoles) {
      if (otherRole.hasParentRole(roleId)) {
        otherRole.removeParentRole(roleId);
        await this.roleRepository.save(otherRole);
      }
    }

    await this.roleRepository.delete(roleId);
  }
}

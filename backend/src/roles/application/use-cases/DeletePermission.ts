import { Injectable, Inject, NotFoundException } from '@nestjs/common';
import type { PermissionRepository } from '../../domain/repositories/PermissionRepository';
import { PermissionId } from '../../domain/value-objects/PermissionId';

@Injectable()
export class DeletePermission {
  constructor(
    @Inject('PermissionRepository')
    private readonly permissionRepository: PermissionRepository,
  ) {}

  async execute(id: string): Promise<void> {
    const permissionId = PermissionId.fromString(id);
    const existingPermission = await this.permissionRepository.findById(
      permissionId,
    );

    if (!existingPermission) {
      throw new NotFoundException(`Permission with ID ${id} not found`);
    }

    await this.permissionRepository.delete(permissionId);
  }
}

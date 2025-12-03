import { RoleId } from '../value-objects/RoleId';
import { PermissionId } from '../value-objects/PermissionId';

export class RolePermissionGranted {
  constructor(
    public readonly roleId: RoleId,
    public readonly permissionId: PermissionId,
    public readonly occurredAt: Date,
  ) {}
}

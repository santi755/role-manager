import { RoleId } from '../value-objects/RoleId';

export class RoleHierarchyChanged {
  constructor(
    public readonly roleId: RoleId,
    public readonly parentRoleId: RoleId,
    public readonly action: 'added' | 'removed',
    public readonly occurredAt: Date,
  ) {}
}

import { UserId } from '../value-objects/UserId';
import { RoleId } from '../../../roles/domain/value-objects/RoleId';

export class UserRoleAssigned {
  constructor(
    public readonly userId: UserId,
    public readonly roleId: RoleId,
    public readonly occurredAt: Date,
  ) {}
}

import { PermissionId } from './value-objects/PermissionId';
import { Action } from './value-objects/Action';
import { Scope } from './value-objects/Scope';
import { Resource } from './value-objects/Resource';

export class Permission {
  private readonly id: PermissionId;
  private readonly action: Action;
  private readonly scope: Scope;
  private readonly resource: Resource;
  private readonly description: string;
  private readonly createdAt: Date;
  private readonly parentPermissions: Set<PermissionId>;

  private constructor(
    id: PermissionId,
    action: Action,
    scope: Scope,
    resource: Resource,
    description: string,
    createdAt: Date,
    parentPermissions: Set<PermissionId> = new Set(),
  ) {
    this.id = id;
    this.action = action;
    this.scope = scope;
    this.resource = resource;
    this.description = description;
    this.createdAt = createdAt;
    this.parentPermissions = parentPermissions;
  }

  static create(
    action: Action,
    scope: Scope,
    resource: Resource,
    description: string,
  ): Permission {
    return new Permission(
      PermissionId.create(),
      action,
      scope,
      resource,
      description,
      new Date(),
    );
  }

  static reconstitute(
    id: PermissionId,
    action: Action,
    scope: Scope,
    resource: Resource,
    description: string,
    createdAt: Date,
    parentPermissions: Set<PermissionId>,
  ): Permission {
    return new Permission(
      id,
      action,
      scope,
      resource,
      description,
      createdAt,
      parentPermissions,
    );
  }

  getId(): PermissionId {
    return this.id;
  }

  getAction(): Action {
    return this.action;
  }

  getScope(): Scope {
    return this.scope;
  }

  getResource(): Resource {
    return this.resource;
  }

  getDescription(): string {
    return this.description;
  }

  getCreatedAt(): Date {
    return this.createdAt;
  }

  getParentPermissions(): ReadonlySet<PermissionId> {
    return this.parentPermissions;
  }

  addParentPermission(parentId: PermissionId): void {
    if (this.id.equals(parentId)) {
      throw new Error('Permission cannot be its own parent');
    }
    if (!this.hasParentPermission(parentId)) {
      this.parentPermissions.add(parentId);
    }
  }

  removeParentPermission(parentId: PermissionId): void {
    const permissionToDelete = Array.from(this.parentPermissions).find((p) =>
      p.equals(parentId),
    );
    if (permissionToDelete) {
      this.parentPermissions.delete(permissionToDelete);
    }
  }

  hasParentPermission(parentId: PermissionId): boolean {
    return Array.from(this.parentPermissions).some((p) => p.equals(parentId));
  }

  /**
   * Check if this permission implies another permission.
   * A permission implies another if:
   * - The action implies the other action (e.g., 'manage' implies all)
   * - The scope implies the other scope (e.g., 'global' implies 'org')
   * - The resource is the same
   */
  implies(other: Permission): boolean {
    return (
      this.action.implies(other.action) &&
      this.scope.implies(other.scope) &&
      this.resource.equals(other.resource)
    );
  }
}

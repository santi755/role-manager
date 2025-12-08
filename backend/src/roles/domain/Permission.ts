import { PermissionId } from './value-objects/PermissionId';
import { Action } from './value-objects/Action';
import { Scope } from './value-objects/Scope';
import { ResourceType } from './value-objects/ResourceType';
import { TargetId } from './value-objects/TargetId';

/**
 * Permission represents an authorization rule with:
 * - action: what can be done (create, read, update, delete, etc.)
 * - resourceType: type of resource (project, document, user, etc.)
 * - targetId: specific target, wildcard, or none (mutually exclusive with scope)
 * - scope: dynamic scope level (own, team, org, global) - only if targetId is none
 */
export class Permission {
  private readonly id: PermissionId;
  private readonly action: Action;
  private readonly resourceType: ResourceType;
  private readonly targetId: TargetId;
  private readonly scope: Scope | null;
  private readonly description: string;
  private readonly createdAt: Date;
  private readonly parentPermissions: Set<PermissionId>;

  private constructor(
    id: PermissionId,
    action: Action,
    resourceType: ResourceType,
    targetId: TargetId,
    scope: Scope | null,
    description: string,
    createdAt: Date,
    parentPermissions: Set<PermissionId> = new Set(),
  ) {
    // Validate mutual exclusivity: targetId and scope cannot coexist
    if (!targetId.isNone() && scope !== null) {
      throw new Error(
        'targetId and scope are mutually exclusive. Use targetId for specific/wildcard or scope for dynamic levels.',
      );
    }

    // If targetId is none, scope must be defined
    if (targetId.isNone() && scope === null) {
      throw new Error(
        'scope is required when targetId is none. Specify a dynamic scope level.',
      );
    }

    this.id = id;
    this.action = action;
    this.resourceType = resourceType;
    this.targetId = targetId;
    this.scope = scope;
    this.description = description;
    this.createdAt = createdAt;
    this.parentPermissions = parentPermissions;
  }

  static create(
    action: Action,
    resourceType: ResourceType,
    targetId: TargetId,
    scope: Scope | null,
    description: string,
  ): Permission {
    return new Permission(
      PermissionId.create(),
      action,
      resourceType,
      targetId,
      scope,
      description,
      new Date(),
    );
  }

  static reconstitute(
    id: PermissionId,
    action: Action,
    resourceType: ResourceType,
    targetId: TargetId,
    scope: Scope | null,
    description: string,
    createdAt: Date,
    parentPermissions: Set<PermissionId>,
  ): Permission {
    return new Permission(
      id,
      action,
      resourceType,
      targetId,
      scope,
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

  getResourceType(): ResourceType {
    return this.resourceType;
  }

  getTargetId(): TargetId {
    return this.targetId;
  }

  getScope(): Scope | null {
    return this.scope;
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
   * - The resource type is the same
   * - The target/scope coverage includes the other permission
   */
  implies(other: Permission): boolean {
    // Must be same resource type
    if (!this.resourceType.equals(other.resourceType)) {
      return false;
    }

    // Action must imply
    if (!this.action.implies(other.action)) {
      return false;
    }

    // Target/Scope logic:
    // 1. Wildcard targetId implies everything
    if (this.targetId.isWildcard()) {
      return true;
    }

    // 2. If both have scopes (dynamic), use scope hierarchy
    if (this.scope && other.scope) {
      return this.scope.implies(other.scope);
    }

    // 3. If both have specific targetIds, they must match
    if (this.targetId.isSpecific() && other.targetId.isSpecific()) {
      return this.targetId.equals(other.targetId);
    }

    // 4. Otherwise, no implication
    return false;
  }
}

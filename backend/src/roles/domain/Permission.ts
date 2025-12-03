import { PermissionId } from './value-objects/PermissionId';
import { ResourceAction } from './value-objects/ResourceAction';

export class Permission {
  private readonly id: PermissionId;
  private readonly resourceAction: ResourceAction;
  private readonly description: string;
  private readonly createdAt: Date;
  private readonly parentPermissions: Set<PermissionId>;

  private constructor(
    id: PermissionId,
    resourceAction: ResourceAction,
    description: string,
    createdAt: Date,
    parentPermissions: Set<PermissionId> = new Set(),
  ) {
    this.id = id;
    this.resourceAction = resourceAction;
    this.description = description;
    this.createdAt = createdAt;
    this.parentPermissions = parentPermissions;
  }

  static create(
    resourceAction: ResourceAction,
    description: string,
  ): Permission {
    return new Permission(
      PermissionId.create(),
      resourceAction,
      description,
      new Date(),
    );
  }

  static reconstitute(
    id: PermissionId,
    resourceAction: ResourceAction,
    description: string,
    createdAt: Date,
    parentPermissions: Set<PermissionId>,
  ): Permission {
    return new Permission(
      id,
      resourceAction,
      description,
      createdAt,
      parentPermissions,
    );
  }

  getId(): PermissionId {
    return this.id;
  }

  getResourceAction(): ResourceAction {
    return this.resourceAction;
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
    this.parentPermissions.add(parentId);
  }

  removeParentPermission(parentId: PermissionId): void {
    this.parentPermissions.delete(parentId);
  }

  hasParentPermission(parentId: PermissionId): boolean {
    return Array.from(this.parentPermissions).some((p) => p.equals(parentId));
  }
}

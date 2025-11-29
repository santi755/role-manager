import { RoleId } from './value-objects/RoleId';
import { PermissionId } from './value-objects/PermissionId';

export class Role {
    private readonly id: RoleId;
    private name: string;
    private description: string;
    private readonly createdAt: Date;
    private readonly parentRoles: Set<RoleId>;
    private readonly permissions: Set<PermissionId>;

    private constructor(
        id: RoleId,
        name: string,
        description: string,
        createdAt: Date,
        parentRoles: Set<RoleId> = new Set(),
        permissions: Set<PermissionId> = new Set(),
    ) {
        this.id = id;
        this.name = name;
        this.description = description;
        this.createdAt = createdAt;
        this.parentRoles = parentRoles;
        this.permissions = permissions;
    }

    static create(name: string, description: string): Role {
        if (!name || name.trim().length === 0) {
            throw new Error('Role name cannot be empty');
        }
        return new Role(RoleId.create(), name, description, new Date());
    }

    static reconstitute(
        id: RoleId,
        name: string,
        description: string,
        createdAt: Date,
        parentRoles: Set<RoleId>,
        permissions: Set<PermissionId>,
    ): Role {
        return new Role(id, name, description, createdAt, parentRoles, permissions);
    }

    getId(): RoleId {
        return this.id;
    }

    getName(): string {
        return this.name;
    }

    getDescription(): string {
        return this.description;
    }

    getCreatedAt(): Date {
        return this.createdAt;
    }

    getParentRoles(): ReadonlySet<RoleId> {
        return this.parentRoles;
    }

    getPermissions(): ReadonlySet<PermissionId> {
        return this.permissions;
    }

    updateName(name: string): void {
        if (!name || name.trim().length === 0) {
            throw new Error('Role name cannot be empty');
        }
        this.name = name;
    }

    updateDescription(description: string): void {
        this.description = description;
    }

    addParentRole(parentId: RoleId): void {
        if (this.id.equals(parentId)) {
            throw new Error('Role cannot be its own parent');
        }
        this.parentRoles.add(parentId);
    }

    removeParentRole(parentId: RoleId): void {
        this.parentRoles.delete(parentId);
    }

    hasParentRole(parentId: RoleId): boolean {
        return Array.from(this.parentRoles).some((p) => p.equals(parentId));
    }

    grantPermission(permissionId: PermissionId): void {
        this.permissions.add(permissionId);
    }

    revokePermission(permissionId: PermissionId): void {
        this.permissions.delete(permissionId);
    }

    hasPermission(permissionId: PermissionId): boolean {
        return Array.from(this.permissions).some((p) => p.equals(permissionId));
    }
}

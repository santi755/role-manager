import { UserId } from './value-objects/UserId';
import { Email } from './value-objects/Email';
import { RoleId } from '../../roles/domain/value-objects/RoleId';
import { PermissionId } from '../../roles/domain/value-objects/PermissionId';

export class User {
    private readonly id: UserId;
    private name: string;
    private readonly email: Email;
    private readonly createdAt: Date;
    private readonly assignedRoles: Set<RoleId>;
    private readonly directPermissionGrants: Set<PermissionId>;
    private readonly directPermissionDenials: Set<PermissionId>;

    private constructor(
        id: UserId,
        name: string,
        email: Email,
        createdAt: Date,
        assignedRoles: Set<RoleId> = new Set(),
        directPermissionGrants: Set<PermissionId> = new Set(),
        directPermissionDenials: Set<PermissionId> = new Set(),
    ) {
        this.id = id;
        this.name = name;
        this.email = email;
        this.createdAt = createdAt;
        this.assignedRoles = assignedRoles;
        this.directPermissionGrants = directPermissionGrants;
        this.directPermissionDenials = directPermissionDenials;
    }

    static create(name: string, email: Email): User {
        if (!name || name.trim().length === 0) {
            throw new Error('User name cannot be empty');
        }
        return new User(UserId.create(), name, email, new Date());
    }

    static reconstitute(
        id: UserId,
        name: string,
        email: Email,
        createdAt: Date,
        assignedRoles: Set<RoleId>,
        directPermissionGrants: Set<PermissionId>,
        directPermissionDenials: Set<PermissionId>,
    ): User {
        return new User(
            id,
            name,
            email,
            createdAt,
            assignedRoles,
            directPermissionGrants,
            directPermissionDenials,
        );
    }

    getId(): UserId {
        return this.id;
    }

    getName(): string {
        return this.name;
    }

    getEmail(): Email {
        return this.email;
    }

    getCreatedAt(): Date {
        return this.createdAt;
    }

    getAssignedRoles(): ReadonlySet<RoleId> {
        return this.assignedRoles;
    }

    getDirectPermissionGrants(): ReadonlySet<PermissionId> {
        return this.directPermissionGrants;
    }

    getDirectPermissionDenials(): ReadonlySet<PermissionId> {
        return this.directPermissionDenials;
    }

    updateName(name: string): void {
        if (!name || name.trim().length === 0) {
            throw new Error('User name cannot be empty');
        }
        this.name = name;
    }

    assignRole(roleId: RoleId): void {
        this.assignedRoles.add(roleId);
    }

    unassignRole(roleId: RoleId): void {
        this.assignedRoles.delete(roleId);
    }

    hasRole(roleId: RoleId): boolean {
        return Array.from(this.assignedRoles).some((r) => r.equals(roleId));
    }

    grantDirectPermission(permissionId: PermissionId): void {
        this.directPermissionGrants.add(permissionId);
        this.directPermissionDenials.delete(permissionId);
    }

    denyDirectPermission(permissionId: PermissionId): void {
        this.directPermissionDenials.add(permissionId);
        this.directPermissionGrants.delete(permissionId);
    }

    revokeDirectPermission(permissionId: PermissionId): void {
        this.directPermissionGrants.delete(permissionId);
        this.directPermissionDenials.delete(permissionId);
    }

    hasDirectPermissionGrant(permissionId: PermissionId): boolean {
        return Array.from(this.directPermissionGrants).some((p) =>
            p.equals(permissionId),
        );
    }

    hasDirectPermissionDenial(permissionId: PermissionId): boolean {
        return Array.from(this.directPermissionDenials).some((p) =>
            p.equals(permissionId),
        );
    }
}

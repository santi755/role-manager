import { Injectable } from '@nestjs/common';
import { Role } from '../../domain/Role';
import { RoleId } from '../../domain/value-objects/RoleId';
import { RoleRepository } from '../../domain/repositories/RoleRepository';

@Injectable()
export class InMemoryRoleRepository implements RoleRepository {
  private roles: Map<string, Role> = new Map();

  async save(role: Role): Promise<void> {
    this.roles.set(role.getId().toString(), role);
  }

  async findById(id: RoleId): Promise<Role | null> {
    return this.roles.get(id.toString()) || null;
  }

  async findByName(name: string): Promise<Role | null> {
    for (const role of this.roles.values()) {
      if (role.getName() === name) {
        return role;
      }
    }
    return null;
  }

  async findAll(): Promise<Role[]> {
    return Array.from(this.roles.values());
  }

  async findByIds(ids: RoleId[]): Promise<Role[]> {
    const roles: Role[] = [];
    for (const id of ids) {
      const role = this.roles.get(id.toString());
      if (role) {
        roles.push(role);
      }
    }
    return roles;
  }

  async delete(id: RoleId): Promise<void> {
    this.roles.delete(id.toString());
  }

  // Helper method for testing
  clear(): void {
    this.roles.clear();
  }

  // Helper method to get all roles as a map (for graph operations)
  getAllAsMap(): Map<string, Role> {
    return new Map(this.roles);
  }
}

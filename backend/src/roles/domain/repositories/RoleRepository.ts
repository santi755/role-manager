import { Role } from '../Role';
import { RoleId } from '../value-objects/RoleId';

export interface RoleRepository {
  save(role: Role): Promise<void>;
  findById(id: RoleId): Promise<Role | null>;
  findByName(name: string): Promise<Role | null>;
  findAll(): Promise<Role[]>;
  findByIds(ids: RoleId[]): Promise<Role[]>;
  delete(id: RoleId): Promise<void>;
}

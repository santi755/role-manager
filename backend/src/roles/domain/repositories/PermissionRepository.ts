import { Permission } from '../Permission';
import { PermissionId } from '../value-objects/PermissionId';
import { ResourceAction } from '../value-objects/ResourceAction';

export interface PermissionRepository {
    save(permission: Permission): Promise<void>;
    findById(id: PermissionId): Promise<Permission | null>;
    findByResourceAction(resourceAction: ResourceAction): Promise<Permission | null>;
    findAll(): Promise<Permission[]>;
    findByIds(ids: PermissionId[]): Promise<Permission[]>;
    delete(id: PermissionId): Promise<void>;
}

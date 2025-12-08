import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { RoleGraphService } from './domain/services/RoleGraphService';
import { PermissionGraphService } from './domain/services/PermissionGraphService';
import { PermissionEvaluator } from './domain/services/PermissionEvaluator';
import { CreateRole } from './application/use-cases/CreateRole';
import { SetRoleParent } from './application/use-cases/SetRoleParent';
import { CreatePermission } from './application/use-cases/CreatePermission';
import { GrantPermissionToRole } from './application/use-cases/GrantPermissionToRole';
import { GetAllRoles } from './application/use-cases/GetAllRoles';
import { GetRoleById } from './application/use-cases/GetRoleById';
import { GetRolePermissions } from './application/use-cases/GetRolePermissions';
import { GetRoleHierarchy } from './application/use-cases/GetRoleHierarchy';
import { GetAllPermissions } from './application/use-cases/GetAllPermissions';
import { GetPermissionById } from './application/use-cases/GetPermissionById';
import { RevokePermissionFromRole } from './application/use-cases/RevokePermissionFromRole';
import { RemoveRoleParent } from './application/use-cases/RemoveRoleParent';
import { DeleteRole } from './application/use-cases/DeleteRole';
import { SetPermissionParent } from './application/use-cases/SetPermissionParent';
import { RemovePermissionParent } from './application/use-cases/RemovePermissionParent';
import { GetPermissionHierarchy } from './application/use-cases/GetPermissionHierarchy';
import { MongoRoleRepository } from './infrastructure/repositories/MongoRoleRepository';
import { MongoPermissionRepository } from './infrastructure/repositories/MongoPermissionRepository';
import { RoleDocument, RoleSchema } from './infrastructure/schemas/role.schema';
import {
  PermissionDocument,
  PermissionSchema,
} from './infrastructure/schemas/permission.schema';
import { RolesController } from './infrastructure/controllers/RolesController';
import { PermissionsController } from './infrastructure/controllers/PermissionsController';
import { UpdatePermission } from './application/use-cases/UpdatePermission';
import { DeletePermission } from './application/use-cases/DeletePermission';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: RoleDocument.name, schema: RoleSchema },
      { name: PermissionDocument.name, schema: PermissionSchema },
    ]),
  ],
  controllers: [RolesController, PermissionsController],
  providers: [
    // Domain Services
    RoleGraphService,
    PermissionGraphService,
    PermissionEvaluator,

    // Repositories - MongoDB Implementation
    {
      provide: 'RoleRepository',
      useClass: MongoRoleRepository,
    },
    {
      provide: 'PermissionRepository',
      useClass: MongoPermissionRepository,
    },

    // Command Use Cases
    CreateRole,
    SetRoleParent,
    CreatePermission,
    GrantPermissionToRole,
    RevokePermissionFromRole,
    RemoveRoleParent,
    DeleteRole,
    UpdatePermission,
    DeletePermission,

    // Query Use Cases
    GetAllRoles,
    GetRoleById,
    GetRolePermissions,
    GetRoleHierarchy,
    GetAllPermissions,
    GetPermissionById,
    SetPermissionParent,
    RemovePermissionParent,
    GetPermissionHierarchy,
  ],
  exports: [
    'RoleRepository',
    'PermissionRepository',
    RoleGraphService,
    PermissionGraphService,
    PermissionEvaluator,
    CreateRole,
    SetRoleParent,
    CreatePermission,
    GrantPermissionToRole,
    RevokePermissionFromRole,
    RemoveRoleParent,
    DeleteRole,
    UpdatePermission,
    DeletePermission,
    GetAllRoles,
    GetRoleById,
    GetRolePermissions,
    GetRoleHierarchy,
    GetAllPermissions,
    GetPermissionById,
    SetPermissionParent,
    RemovePermissionParent,
    GetPermissionHierarchy,
  ],
})
export class RolesModule {}

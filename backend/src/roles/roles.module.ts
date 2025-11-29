import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { RoleGraphService } from './domain/services/RoleGraphService';
import { PermissionGraphService } from './domain/services/PermissionGraphService';
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
import { MongoRoleRepository } from './infrastructure/repositories/MongoRoleRepository';
import { MongoPermissionRepository } from './infrastructure/repositories/MongoPermissionRepository';
import { RoleDocument, RoleSchema } from './infrastructure/schemas/role.schema';
import {
    PermissionDocument,
    PermissionSchema,
} from './infrastructure/schemas/permission.schema';
import { RolesController } from './infrastructure/controllers/RolesController';
import { PermissionsController } from './infrastructure/controllers/PermissionsController';

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

        // Query Use Cases
        GetAllRoles,
        GetRoleById,
        GetRolePermissions,
        GetRoleHierarchy,
        GetAllPermissions,
        GetPermissionById,
    ],
    exports: [
        'RoleRepository',
        'PermissionRepository',
        RoleGraphService,
        PermissionGraphService,
        CreateRole,
        SetRoleParent,
        CreatePermission,
        GrantPermissionToRole,
        RevokePermissionFromRole,
        RemoveRoleParent,
        GetAllRoles,
        GetRoleById,
        GetRolePermissions,
        GetRoleHierarchy,
        GetAllPermissions,
        GetPermissionById,
    ],
})
export class RolesModule { }


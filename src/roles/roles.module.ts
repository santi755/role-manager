import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { RoleGraphService } from './domain/services/RoleGraphService';
import { PermissionGraphService } from './domain/services/PermissionGraphService';
import { CreateRole } from './application/use-cases/CreateRole';
import { SetRoleParent } from './application/use-cases/SetRoleParent';
import { CreatePermission } from './application/use-cases/CreatePermission';
import { GrantPermissionToRole } from './application/use-cases/GrantPermissionToRole';
import { MongoRoleRepository } from './infrastructure/repositories/MongoRoleRepository';
import { MongoPermissionRepository } from './infrastructure/repositories/MongoPermissionRepository';
import { RoleDocument, RoleSchema } from './infrastructure/schemas/role.schema';
import {
    PermissionDocument,
    PermissionSchema,
} from './infrastructure/schemas/permission.schema';

@Module({
    imports: [
        MongooseModule.forFeature([
            { name: RoleDocument.name, schema: RoleSchema },
            { name: PermissionDocument.name, schema: PermissionSchema },
        ]),
    ],
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

        // Use Cases
        CreateRole,
        SetRoleParent,
        CreatePermission,
        GrantPermissionToRole,
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
    ],
})
export class RolesModule { }

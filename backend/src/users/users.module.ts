import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { RolesModule } from '../roles/roles.module';
import { CreateUser } from './application/use-cases/CreateUser';
import { AssignRoleToUser } from './application/use-cases/AssignRoleToUser';
import { CheckUserPermission } from './application/use-cases/CheckUserPermission';
import { GetAllUsers } from './application/use-cases/GetAllUsers';
import { GetUserById } from './application/use-cases/GetUserById';
import { GetUserRoles } from './application/use-cases/GetUserRoles';
import { GetUserPermissions } from './application/use-cases/GetUserPermissions';
import { UnassignRoleFromUser } from './application/use-cases/UnassignRoleFromUser';
import { MongoUserRepository } from './infrastructure/repositories/MongoUserRepository';
import { UserDocument, UserSchema } from './infrastructure/schemas/user.schema';
import { UsersController } from './infrastructure/controllers/UsersController';

@Module({
  imports: [
    RolesModule,
    MongooseModule.forFeature([
      { name: UserDocument.name, schema: UserSchema },
    ]),
  ],
  controllers: [UsersController],
  providers: [
    // Repositories - MongoDB Implementation
    {
      provide: 'UserRepository',
      useClass: MongoUserRepository,
    },

    // Command Use Cases
    CreateUser,
    AssignRoleToUser,
    UnassignRoleFromUser,

    // Query Use Cases
    GetAllUsers,
    GetUserById,
    GetUserRoles,
    GetUserPermissions,
    CheckUserPermission,
  ],
  exports: [
    'UserRepository',
    CreateUser,
    AssignRoleToUser,
    UnassignRoleFromUser,
    GetAllUsers,
    GetUserById,
    GetUserRoles,
    GetUserPermissions,
    CheckUserPermission,
  ],
})
export class UsersModule {}

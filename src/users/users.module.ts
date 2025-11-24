import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { RolesModule } from '../roles/roles.module';
import { CreateUser } from './application/use-cases/CreateUser';
import { AssignRoleToUser } from './application/use-cases/AssignRoleToUser';
import { CheckUserPermission } from './application/use-cases/CheckUserPermission';
import { MongoUserRepository } from './infrastructure/repositories/MongoUserRepository';
import { UserDocument, UserSchema } from './infrastructure/schemas/user.schema';

@Module({
    imports: [
        RolesModule,
        MongooseModule.forFeature([
            { name: UserDocument.name, schema: UserSchema },
        ]),
    ],
    providers: [
        // Repositories - MongoDB Implementation
        {
            provide: 'UserRepository',
            useClass: MongoUserRepository,
        },

        // Use Cases
        CreateUser,
        AssignRoleToUser,
        CheckUserPermission,
    ],
    exports: [
        'UserRepository',
        CreateUser,
        AssignRoleToUser,
        CheckUserPermission,
    ],
})
export class UsersModule { }

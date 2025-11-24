import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { User } from '../../domain/User';
import { UserId } from '../../domain/value-objects/UserId';
import { Email } from '../../domain/value-objects/Email';
import { RoleId } from '../../../roles/domain/value-objects/RoleId';
import { PermissionId } from '../../../roles/domain/value-objects/PermissionId';
import { UserRepository } from '../../domain/repositories/UserRepository';
import { UserDocument } from '../schemas/user.schema';

@Injectable()
export class MongoUserRepository implements UserRepository {
    constructor(
        @InjectModel(UserDocument.name)
        private userModel: Model<UserDocument>,
    ) { }

    async save(user: User): Promise<void> {
        const doc = {
            id: user.getId().toString(),
            name: user.getName(),
            email: user.getEmail().toString(),
            createdAt: user.getCreatedAt(),
            assignedRoles: Array.from(user.getAssignedRoles()).map((r) =>
                r.toString(),
            ),
            directPermissionGrants: Array.from(user.getDirectPermissionGrants()).map(
                (p) => p.toString(),
            ),
            directPermissionDenials: Array.from(
                user.getDirectPermissionDenials(),
            ).map((p) => p.toString()),
        };

        await this.userModel.findOneAndUpdate(
            { id: doc.id },
            doc,
            { upsert: true, new: true },
        );
    }

    async findById(id: UserId): Promise<User | null> {
        const doc = await this.userModel.findOne({ id: id.toString() }).exec();
        if (!doc) return null;
        return this.toDomain(doc);
    }

    async findByEmail(email: Email): Promise<User | null> {
        const doc = await this.userModel.findOne({ email: email.toString() }).exec();
        if (!doc) return null;
        return this.toDomain(doc);
    }

    async findAll(): Promise<User[]> {
        const docs = await this.userModel.find().exec();
        return docs.map((doc) => this.toDomain(doc));
    }

    async delete(id: UserId): Promise<void> {
        await this.userModel.deleteOne({ id: id.toString() }).exec();
    }

    private toDomain(doc: UserDocument): User {
        return User.reconstitute(
            UserId.fromString(doc.id),
            doc.name,
            Email.create(doc.email),
            doc.createdAt,
            new Set(doc.assignedRoles.map((r) => RoleId.fromString(r))),
            new Set(doc.directPermissionGrants.map((p) => PermissionId.fromString(p))),
            new Set(doc.directPermissionDenials.map((p) => PermissionId.fromString(p))),
        );
    }
}

import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Role } from '../../domain/Role';
import { RoleId } from '../../domain/value-objects/RoleId';
import { PermissionId } from '../../domain/value-objects/PermissionId';
import { RoleRepository } from '../../domain/repositories/RoleRepository';
import { RoleDocument } from '../schemas/role.schema';

@Injectable()
export class MongoRoleRepository implements RoleRepository {
  constructor(
    @InjectModel(RoleDocument.name)
    private roleModel: Model<RoleDocument>,
  ) {}

  async save(role: Role): Promise<void> {
    const doc = {
      id: role.getId().toString(),
      name: role.getName(),
      description: role.getDescription(),
      createdAt: role.getCreatedAt(),
      parentRoles: Array.from(role.getParentRoles()).map((r) => r.toString()),
      permissions: Array.from(role.getPermissions()).map((p) => p.toString()),
    };

    await this.roleModel.findOneAndUpdate({ id: doc.id }, doc, {
      upsert: true,
      new: true,
    });
  }

  async findById(id: RoleId): Promise<Role | null> {
    const doc = await this.roleModel.findOne({ id: id.toString() }).exec();
    if (!doc) return null;
    return this.toDomain(doc);
  }

  async findByName(name: string): Promise<Role | null> {
    const doc = await this.roleModel.findOne({ name }).exec();
    if (!doc) return null;
    return this.toDomain(doc);
  }

  async findAll(): Promise<Role[]> {
    const docs = await this.roleModel.find().exec();
    return docs.map((doc) => this.toDomain(doc));
  }

  async findByIds(ids: RoleId[]): Promise<Role[]> {
    const idStrings = ids.map((id) => id.toString());
    const docs = await this.roleModel.find({ id: { $in: idStrings } }).exec();
    return docs.map((doc) => this.toDomain(doc));
  }

  async delete(id: RoleId): Promise<void> {
    await this.roleModel.deleteOne({ id: id.toString() }).exec();
  }

  private toDomain(doc: RoleDocument): Role {
    return Role.reconstitute(
      RoleId.fromString(doc.id),
      doc.name,
      doc.description,
      doc.createdAt,
      new Set(doc.parentRoles.map((r) => RoleId.fromString(r))),
      new Set(doc.permissions.map((p) => PermissionId.fromString(p))),
    );
  }
}

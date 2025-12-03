import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Permission } from '../../domain/Permission';
import { PermissionId } from '../../domain/value-objects/PermissionId';
import { ResourceAction } from '../../domain/value-objects/ResourceAction';
import { PermissionRepository } from '../../domain/repositories/PermissionRepository';
import { PermissionDocument } from '../schemas/permission.schema';

@Injectable()
export class MongoPermissionRepository implements PermissionRepository {
  constructor(
    @InjectModel(PermissionDocument.name)
    private permissionModel: Model<PermissionDocument>,
  ) {}

  async save(permission: Permission): Promise<void> {
    const doc = {
      id: permission.getId().toString(),
      resource: permission.getResourceAction().getResource(),
      action: permission.getResourceAction().getAction(),
      description: permission.getDescription(),
      createdAt: permission.getCreatedAt(),
      parentPermissions: Array.from(permission.getParentPermissions()).map(
        (p) => p.toString(),
      ),
    };

    await this.permissionModel.findOneAndUpdate({ id: doc.id }, doc, {
      upsert: true,
      new: true,
    });
  }

  async findById(id: PermissionId): Promise<Permission | null> {
    const doc = await this.permissionModel
      .findOne({ id: id.toString() })
      .exec();
    if (!doc) return null;
    return this.toDomain(doc);
  }

  async findByResourceAction(
    resourceAction: ResourceAction,
  ): Promise<Permission | null> {
    const doc = await this.permissionModel
      .findOne({
        resource: resourceAction.getResource(),
        action: resourceAction.getAction(),
      })
      .exec();
    if (!doc) return null;
    return this.toDomain(doc);
  }

  async findAll(): Promise<Permission[]> {
    const docs = await this.permissionModel.find().exec();
    return docs.map((doc) => this.toDomain(doc));
  }

  async findByIds(ids: PermissionId[]): Promise<Permission[]> {
    const idStrings = ids.map((id) => id.toString());
    const docs = await this.permissionModel
      .find({ id: { $in: idStrings } })
      .exec();
    return docs.map((doc) => this.toDomain(doc));
  }

  async delete(id: PermissionId): Promise<void> {
    await this.permissionModel.deleteOne({ id: id.toString() }).exec();
  }

  private toDomain(doc: PermissionDocument): Permission {
    return Permission.reconstitute(
      PermissionId.fromString(doc.id),
      ResourceAction.create(doc.resource, doc.action),
      doc.description,
      doc.createdAt,
      new Set(doc.parentPermissions.map((p) => PermissionId.fromString(p))),
    );
  }
}

import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Permission } from '../../domain/Permission';
import { PermissionId } from '../../domain/value-objects/PermissionId';
import { Action } from '../../domain/value-objects/Action';
import { Scope } from '../../domain/value-objects/Scope';
import { Resource } from '../../domain/value-objects/Resource';
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
      action: permission.getAction().toString(),
      scope: permission.getScope().toData(),
      resource: permission.getResource().toString(),
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

  async findByActionScopeResource(
    action: Action,
    scope: Scope,
    resource: Resource,
  ): Promise<Permission | null> {
    const doc = await this.permissionModel
      .findOne({
        action: action.toString(),
        'scope.level': scope.getLevel(),
        'scope.target': scope.getTarget() || { $exists: false },
        resource: resource.toString(),
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
      Action.fromString(doc.action),
      Scope.fromData({
        level: doc.scope.level as
          | 'own'
          | 'team'
          | 'org'
          | 'global'
          | 'specific',
        target: doc.scope.target,
      }),
      Resource.create(doc.resource),
      doc.description,
      doc.createdAt,
      new Set(doc.parentPermissions.map((p) => PermissionId.fromString(p))),
    );
  }
}

import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Permission } from '../../domain/Permission';
import { PermissionId } from '../../domain/value-objects/PermissionId';
import { Action } from '../../domain/value-objects/Action';
import { Scope } from '../../domain/value-objects/Scope';
import { ResourceType } from '../../domain/value-objects/ResourceType';
import { TargetId } from '../../domain/value-objects/TargetId';
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
      resource_type: permission.getResourceType().toString(),
      target_id: permission.getTargetId().toJSON(),
      scope: permission.getScope()?.toString() ?? null,
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
    resourceType: ResourceType,
    targetId: TargetId,
    scope: Scope | null,
  ): Promise<Permission | null> {
    const doc = await this.permissionModel
      .findOne({
        action: action.toString(),
        resource_type: resourceType.toString(),
        target_id: targetId.toJSON(),
        scope: scope?.toString() ?? null,
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
    const action = Action.fromString(doc.action);
    const resourceType = ResourceType.create(doc.resource_type);
    const targetId = TargetId.fromString(doc.target_id);
    const scope = doc.scope ? Scope.fromString(doc.scope) : null;

    return Permission.reconstitute(
      PermissionId.fromString(doc.id),
      action,
      resourceType,
      targetId,
      scope,
      doc.description,
      doc.createdAt,
      new Set(doc.parentPermissions.map((p) => PermissionId.fromString(p))),
    );
  }
}

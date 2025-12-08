import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

@Schema({ collection: 'permissions' })
export class PermissionDocument extends Document {
  @Prop({ required: true, unique: true })
  declare id: string;

  @Prop({
    required: true,
    enum: ['create', 'read', 'update', 'delete', 'execute', 'manage'],
  })
  action: string;

  @Prop({
    type: {
      level: {
        type: String,
        required: true,
        enum: ['own', 'team', 'org', 'global', 'specific'],
      },
      target: { type: String, required: false },
    },
    required: true,
  })
  scope: { level: string; target?: string };

  @Prop({ required: true })
  resource: string;

  @Prop({ required: true })
  description: string;

  @Prop({ type: Date, required: true })
  createdAt: Date;

  @Prop({ type: [String], default: [] })
  parentPermissions: string[];
}

export const PermissionSchema =
  SchemaFactory.createForClass(PermissionDocument);

// Create compound unique index for action + scope.level + resource
PermissionSchema.index(
  { action: 1, 'scope.level': 1, resource: 1 },
  { unique: true },
);

// Create index for specific scope target queries
PermissionSchema.index({ 'scope.target': 1 });

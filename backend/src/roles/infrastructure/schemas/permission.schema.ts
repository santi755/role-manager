import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

@Schema({ collection: 'permissions' })
export class PermissionDocument extends Document {
  @Prop({ required: true, unique: true })
  declare id: string;

  @Prop({ required: true })
  action: string;

  @Prop({ required: true })
  resource_type: string;

  @Prop({ type: String, default: null })
  target_id: string | null;

  @Prop({ type: String, default: null })
  scope: string | null;

  @Prop({ required: true })
  description: string;

  @Prop({ type: Date, required: true })
  createdAt: Date;

  @Prop({ type: [String], default: [] })
  parentPermissions: string[];
}

export const PermissionSchema =
  SchemaFactory.createForClass(PermissionDocument);

// Create compound unique index for action + resource_type + target_id + scope
PermissionSchema.index(
  { action: 1, resource_type: 1, target_id: 1, scope: 1 },
  { unique: true },
);

// Create index for resource_type queries
PermissionSchema.index({ resource_type: 1 });

// Create index for target_id queries
PermissionSchema.index({ target_id: 1 });

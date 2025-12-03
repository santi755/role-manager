import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

@Schema({ collection: 'permissions' })
export class PermissionDocument extends Document {
  @Prop({ required: true, unique: true })
  declare id: string;

  @Prop({ required: true })
  resource: string;

  @Prop({ required: true })
  action: string;

  @Prop({ required: true })
  description: string;

  @Prop({ type: Date, required: true })
  createdAt: Date;

  @Prop({ type: [String], default: [] })
  parentPermissions: string[];
}

export const PermissionSchema =
  SchemaFactory.createForClass(PermissionDocument);

// Create compound unique index for resource + action
PermissionSchema.index({ resource: 1, action: 1 }, { unique: true });

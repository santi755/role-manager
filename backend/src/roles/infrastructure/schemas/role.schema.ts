import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

@Schema({ collection: 'roles' })
export class RoleDocument extends Document {
  @Prop({ required: true, unique: true })
  declare id: string;

  @Prop({ required: true, unique: true })
  name: string;

  @Prop({ required: true })
  description: string;

  @Prop({ type: Date, required: true })
  createdAt: Date;

  @Prop({ type: [String], default: [] })
  parentRoles: string[];

  @Prop({ type: [String], default: [] })
  permissions: string[];
}

export const RoleSchema = SchemaFactory.createForClass(RoleDocument);

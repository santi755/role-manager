import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

@Schema({ collection: 'users' })
export class UserDocument extends Document {
    @Prop({ required: true, unique: true })
    declare id: string;

    @Prop({ required: true })
    name: string;

    @Prop({ required: true, unique: true })
    email: string;

    @Prop({ type: Date, required: true })
    createdAt: Date;

    @Prop({ type: [String], default: [] })
    assignedRoles: string[];

    @Prop({ type: [String], default: [] })
    directPermissionGrants: string[];

    @Prop({ type: [String], default: [] })
    directPermissionDenials: string[];
}

export const UserSchema = SchemaFactory.createForClass(UserDocument);

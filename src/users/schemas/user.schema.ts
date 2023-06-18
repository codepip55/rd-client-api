import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type UserDocument = User & Document;

@Schema()
export class User {
  _id: string;
  get id() {
    return this._id;
  }

  @Prop({ required: true, unique: true })
  cid: number;

  @Prop({ required: true })
  nameFull: string;

  @Prop({ required: true })
  nameFirst: string;

  @Prop({ required: true })
  nameLast: string;

  @Prop()
  currentPosition: string | null;
}

const UserSchema = SchemaFactory.createForClass(User);
UserSchema.index({ nameFull: 'text' });
export { UserSchema };

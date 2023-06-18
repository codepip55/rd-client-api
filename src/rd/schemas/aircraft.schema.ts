import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import mongoose, { Document } from 'mongoose';
import { User } from 'src/users/schemas/user.schema';

export type RDAircraftDocument = RDAircraft & Document;

@Schema()
export class RDAircraft {
  @Prop({ required: true })
  addedTimestamp: Date;

  @Prop({
    type: mongoose.Schema.Types.ObjectId,
    ref: 'rd_user',
    required: true,
  })
  localController: User;

  @Prop({
    type: mongoose.Schema.Types.ObjectId,
    ref: 'rd_user',
    required: true,
  })
  departureController: User;

  @Prop({ required: true })
  accepted: boolean;

  @Prop({ required: true })
  callsign: string;

  @Prop({ required: true, maxlength: 4 })
  transponder: string;
}

const RDAircraftSchema = SchemaFactory.createForClass(RDAircraft);
export { RDAircraftSchema };

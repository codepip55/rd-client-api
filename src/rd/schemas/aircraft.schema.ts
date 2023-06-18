import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type RDAircraftDocument = RDAircraft & Document;

@Schema()
export class RDAircraft {
  @Prop({ required: true })
  addedTimestamp: Date;

  @Prop({ required: true })
  localController: string;

  @Prop({ required: true })
  departureController: string;

  @Prop({ required: true })
  accepted: boolean;

  @Prop({ required: true })
  callsign: string;

  @Prop({ required: true, maxlength: 4 })
  transponder: string;
}

const RDAircraftSchema = SchemaFactory.createForClass(RDAircraft);
export { RDAircraftSchema };

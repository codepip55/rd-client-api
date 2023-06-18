import { IsBoolean, IsISO8601, IsString } from 'class-validator';

export class RdAircraftDto {
  @IsISO8601()
  addedTimestamp: Date;

  @IsString()
  localController: string;

  @IsString()
  departureController: string;

  @IsBoolean()
  accepted: boolean;

  @IsString()
  transponder: string;
}

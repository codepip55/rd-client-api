import { IsNumber, IsString } from 'class-validator';

export class UserDto {
  @IsNumber()
  cid: number;

  @IsString()
  nameFirst: string;

  @IsString()
  nameLast: string;

  @IsString()
  nameFull: string;

  @IsString()
  currentPosition: string;
}

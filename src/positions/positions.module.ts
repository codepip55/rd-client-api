import { Module } from '@nestjs/common';
import { PositionsService } from './positions.service';
import { PositionsController } from './positions.controller';
import { UserSchema } from 'src/users/schemas/user.schema';
import { MongooseModule } from '@nestjs/mongoose';
import { ScheduleModule } from '@nestjs/schedule';
import { VatsimModule } from 'src/vatsim/vatsim.module';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: 'rd_user', schema: UserSchema },
    ]),
    ScheduleModule,
    VatsimModule
  ],
  providers: [PositionsService],
  controllers: [PositionsController]
})
export class PositionsModule {}

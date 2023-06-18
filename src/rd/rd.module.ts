import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { ScheduleModule } from '@nestjs/schedule';

import { RdService } from './rd.service';
import { RdController } from './rd.controller';
import { RDAircraftSchema } from './schemas/aircraft.schema';
import { VatsimModule } from 'src/vatsim/vatsim.module';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: 'rd_aircraft', schema: RDAircraftSchema },
    ]),
    VatsimModule,
    ScheduleModule.forRoot(),
  ],
  providers: [RdService],
  controllers: [RdController],
})
export class RdModule {}

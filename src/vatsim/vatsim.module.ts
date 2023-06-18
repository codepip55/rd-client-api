import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { CacheModule } from '@nestjs/cache-manager';

import { VatsimService } from './vatsim.service';

@Module({
  imports: [HttpModule, CacheModule.register()],
  providers: [VatsimService],
  exports: [VatsimService],
})
export class VatsimModule {}

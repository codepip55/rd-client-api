import { CacheModule, Module } from '@nestjs/common';
import { VatsimService } from './vatsim.service';
import { HttpModule } from '@nestjs/axios';

@Module({
  imports: [HttpModule, CacheModule.register()],
  providers: [VatsimService],
  exports: [VatsimService],
})
export class VatsimModule {}

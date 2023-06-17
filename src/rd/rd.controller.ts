import { Body, Controller, Delete, Get, Param, Post, Put, Query, Req, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { Request } from 'express';

import { RdService } from './rd.service';
import { RdAircraftDto } from './dto/rdAircraft.dto';
import { User } from 'src/users/schemas/user.schema';
import { JwtAuthGuard } from 'src/auth/jwt/jwt-auth.guard';

@ApiBearerAuth()
@ApiTags('RD')
@Controller('rd')
export class RdController {

  constructor(
    private rdService: RdService
  ) { }

  @Get('aircraft')
  @UseGuards(JwtAuthGuard)
  getAircraft(@Query() qs: Record<string, string>) {
    const code = qs.code;
    const callsign = qs.callsign;

    return this.rdService.getAircraft({ code, callsign });
  }

  @Post('aircraft')
  @UseGuards(JwtAuthGuard)
  addAircraft(
    @Req() req: Request,
    @Query() qs: Record<string, string>
  ) {
    const code = qs.code;
    const callsign = qs.callsign;
    const user = req.user as User;

    return this.rdService.addAircraftToRD({ code, callsign }, user);
  }

  @Get('list/:controller')
  @UseGuards(JwtAuthGuard)
  getControllerList(@Param('controller') controller: string) {
    return this.rdService.getRdList(controller)
  }

  @Put('aircraft')
  @UseGuards(JwtAuthGuard)
  updateAircraft(@Query() qs: Record<string, string>, @Body() body: RdAircraftDto) {
    const code = qs.code;
    const callsign = qs.callsign;

    return this.rdService.updateRdAircraft({ code, callsign }, body);
  }

  @Delete('aircraft')
  @UseGuards(JwtAuthGuard)
  deleteAircraft(@Query() qs: Record<string, string>) {
    const code = qs.code;
    const callsign = qs.callsign;

    return this.rdService.deleteRdAircraft({ code, callsign })
  }
}

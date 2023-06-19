import { Body, Controller, Delete, Get, Param, Post, Put, Query, Req, UseGuards, } from '@nestjs/common';
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
  constructor(private rdService: RdService) {}

  /**
   * Get all aircraft registered to the RD service
   */
  @Get('aircraft')
  @UseGuards(JwtAuthGuard)
  getAircraft(@Query() qs: Record<string, string>) {
    const code = qs.code;
    const callsign = qs.callsign;

    return this.rdService.getAircraft({ code, callsign });
  }

  /**
   * Registers and aircraft with the RD client.
   * Input code or callsign. Will pull from the VATSIM 
   * datafeed and store the relevant information
   */
  @Post('aircraft')
  @UseGuards(JwtAuthGuard)
  addAircraft(@Req() req: Request, @Query() qs: Record<string, string>) {
    const code = qs.code;
    const callsign = qs.callsign;
    const user = req.user as User;

    return this.rdService.addAircraftToRD({ code, callsign }, user);
  }

  /**
   * Get the list of aircraft for a specific controller.
   * Input controller's ObjectID.
   */
  @Get('list/:controller')
  @UseGuards(JwtAuthGuard)
  getControllerList(@Param('controller') controller: string) {
    return this.rdService.getRdList(controller);
  }

  /**
   * Update a registered aicraft.
   * Mostly used to change the accepted state
   */
  @Put('aircraft/accept')
  @UseGuards(JwtAuthGuard)
  updateAircraft(
    @Query() qs: Record<string, string>,
  ) {
    const code = qs.code;
    const callsign = qs.callsign;

    return this.rdService.acceptAircraft({ code, callsign });
  }

  /**
   * Remove a registered aircraft from the RD Client.
   * Also run automatically to detect VATSIM connection termination and
   * when aircraft is airborne.
   */
  @Delete('aircraft')
  @UseGuards(JwtAuthGuard)
  deleteAircraft(@Query() qs: Record<string, string>) {
    const code = qs.code;
    const callsign = qs.callsign;

    return this.rdService.deleteRdAircraft({ code, callsign });
  }
}

import { Controller, Get, Post, Query, Req, UseGuards } from '@nestjs/common';
import { Request } from 'express';

import { PositionsService } from './positions.service';
import { JwtAuthGuard } from 'src/auth/jwt/jwt-auth.guard';
import { User } from 'src/users/schemas/user.schema';

@Controller('positions')
export class PositionsController {
  constructor(private positionsService: PositionsService) {}

  /**
   * Find all controllers connected to the RD Client
   */
  @Get()
  @UseGuards(JwtAuthGuard)
  findAllControllers() {
    return this.positionsService.findAllControllers();
  }

  /**
   * Find a controller connected to the RD Client by CID or Callsign
   */
  @Get('find')
  @UseGuards(JwtAuthGuard)
  findController(@Query() qs: Record<string, string>) {
    const cid = qs.cid;
    const callsign = qs.callsign;

    return this.positionsService.findController({ cid, callsign });
  }

  /**
   * Logon to the RD Client
   * Will read your VATSIM connection and automatically set the 
   * correct callsign for your connection
   */
  @Post('logon')
  @UseGuards(JwtAuthGuard)
  logonPosition(@Req() req: Request) {
    const user = req.user as User;

    return this.positionsService.logonPosition(user);
  }

  /**
   * Logoff from the RD Client
   * Will reset your registered VATSIM connection.
   * Also automatically run to detect when your VATSIM connection
   * is terminated.
   */
  @Post('logoff')
  @UseGuards(JwtAuthGuard)
  logoffPosition(@Req() req: Request) {
    const user = req.user as User;

    return this.positionsService.logoffPosition(user);
  }
}

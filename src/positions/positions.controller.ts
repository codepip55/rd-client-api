import { Controller, Get, Post, Query, Req, UseGuards } from '@nestjs/common';
import { PositionsService } from './positions.service';
import { JwtAuthGuard } from 'src/auth/jwt/jwt-auth.guard';
import { Request } from 'express';
import { User } from 'src/users/schemas/user.schema';

@Controller('positions')
export class PositionsController {

  constructor(
    private positionsService: PositionsService
  ) { }

  @Get()
  @UseGuards(JwtAuthGuard)
  findAllControllers() {
    return this.positionsService.findAllControllers()
  }

  @Get('find')
  @UseGuards(JwtAuthGuard)
  findController(@Query() qs: Record<string, string>) {
    
  }

  @Post('logon')
  @UseGuards(JwtAuthGuard)
  logonPosition(@Req() req: Request) {
    const user = req.user as User

    return this.positionsService.logonPosition(user)
  }

  @Post('logoff')
  @UseGuards(JwtAuthGuard)
  logoffPosition(@Req() req: Request) {
    const user = req.user as User

    return this.positionsService.logoffPosition(user)
  }
}

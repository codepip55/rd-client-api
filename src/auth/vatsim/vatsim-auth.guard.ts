import { Injectable } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

@Injectable()
export class VatsimAuthGuard extends AuthGuard('vatsim') {}

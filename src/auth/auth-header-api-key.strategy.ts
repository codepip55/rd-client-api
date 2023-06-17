import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ConfigService } from '@nestjs/config';
import Strategy from 'passport-headerapikey';

import { UsersService } from 'src/users/users.service';

@Injectable()
export class HeaderApiKeyStrategy extends PassportStrategy(
  Strategy,
  'api-key',
) {
  constructor(
    private readonly configService: ConfigService,
    private readonly userService: UsersService,
  ) {
    super({ header: 'X-API-KEY', prefix: '' }, true, async (apiKey, done) => {
      return this.validate(apiKey, done);
    });
  }

  public validate = async (apiKey: string, done: any) => {
    if (this.configService.get<string>('API_KEY') === apiKey) {
      const user = await this.userService.findByCid(0);
      done(null, user);
    }
    done(new UnauthorizedException(), null);
  };
}
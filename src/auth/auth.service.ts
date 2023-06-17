import { Injectable, UnauthorizedException } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { firstValueFrom } from 'rxjs';

import { UsersService } from 'src/users/users.service';

@Injectable()
export class AuthService {
  constructor(
    private jwtService: JwtService,
    private configService: ConfigService,
    private http: HttpService,
    private userService: UsersService,
  ) {}

  getTokens(user: any) {
    const payload = { sub: user.user._id };

    const refreshToken = user.refreshToken;
    delete user.refreshToken;

    return {
      token: this.jwtService.sign(payload),
      expiresIn: 30 * 60 * 1000,
      refreshToken,
    };
  }

  async refresh(refreshToken: string) {
    const params = new URLSearchParams({
      grant_type: 'refresh_token',
      client_id: this.configService.get<string>('VATSIM_AUTH_CLIENT_ID'),
      client_secret: this.configService.get<string>(
        'VATSIM_AUTH_CLIENT_SECRET',
      ),
      refresh_token: refreshToken,
    });

    const tokenURL = this.configService.get<string>('VATSIM_AUTH_TOKEN_URL');
    const $creds = this.http.post(tokenURL, params.toString(), {
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
    });

    let creds: any;
    try {
      creds = (await firstValueFrom($creds)).data;
    } catch (err) {
      throw new UnauthorizedException();
    }

    const userURL = this.configService.get<string>('VATSIM_AUTH_USER_INFO_URL');
    const $user = this.http.get(userURL, {
      headers: {
        Authorization: `Bearer ${creds.access_token}`,
      },
    });

    try {
      const ssoUser = (await firstValueFrom($user)).data.data;
      const user = await this.userService.findByCid(ssoUser.cid);

      return {
        user,
        token: this.jwtService.sign({ sub: user.id }),
        expiresIn: 30 * 60 * 1000,
        newRefreshToken: creds.refresh_token,
      };
    } catch (err) {
      throw new UnauthorizedException();
    }
  }
}
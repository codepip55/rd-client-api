import { Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { HttpModule } from '@nestjs/axios';
import { PassportModule } from '@nestjs/passport';
import { JwtModule } from '@nestjs/jwt';

import { UsersModule } from '../users/users.module';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { VatsimStrategy } from './vatsim/vatsim.strategy';
import { JwtStrategy } from './jwt/jwt.strategy';
import { HeaderApiKeyStrategy } from './auth-header-api-key.strategy';

@Module({
  imports: [
    HttpModule,
    PassportModule,
    UsersModule,
    JwtModule.registerAsync({
      useFactory: async (configService: ConfigService) => {
        return {
          secret: configService.get<string>('JWT_SECRET'),
          signOptions: { expiresIn: '30m' },
        };
      },
      inject: [ConfigService],
    }),
  ],
  providers: [AuthService, VatsimStrategy, JwtStrategy, HeaderApiKeyStrategy],
  controllers: [AuthController],
})
export class AuthModule {}

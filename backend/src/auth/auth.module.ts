import { Module } from '@nestjs/common';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { UsersModule } from '../users/users.module';
import { PassportModule } from '@nestjs/passport';
import { JwtModule } from '@nestjs/jwt';
import { LocalStrategy } from './local.strategy';
import { JwtStrategy } from './jwt.strategy';

import { SecurityService } from './security.service';
import { AccessControlService } from './access-control.service';
import { MailModule } from '../mail/mail.module';
import { LicenseService } from './license.service';
import { LicenseController } from './license.controller';

@Module({
  imports: [
    UsersModule,
    PassportModule,
    MailModule,
    JwtModule.register({
      secret: process.env.JWT_SECRET || 'secret',
      signOptions: { expiresIn: '1d' },
    }),
  ],
  providers: [AuthService, LocalStrategy, JwtStrategy, SecurityService, LicenseService],
  controllers: [AuthController, LicenseController],
  exports: [AuthService, SecurityService, LicenseService],
})
export class AuthModule { }

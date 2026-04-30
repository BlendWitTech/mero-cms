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
import { PackagesModule } from '../packages/packages.module';

@Module({
  imports: [
    UsersModule,
    PassportModule,
    MailModule,
    PackagesModule,
    JwtModule.register({
      // JWT_SECRET presence is enforced at boot by assertRequiredSecrets()
      // in main.ts. No fallback — a missing secret means refuse to start.
      secret: process.env.JWT_SECRET,
      signOptions: { expiresIn: '1d' },
    }),
  ],
  providers: [AuthService, LocalStrategy, JwtStrategy, SecurityService, LicenseService],
  controllers: [AuthController, LicenseController],
  exports: [AuthService, SecurityService, LicenseService],
  // LicenseController depends on SaasLicenseService which is exported from PackagesModule
})
export class AuthModule { }

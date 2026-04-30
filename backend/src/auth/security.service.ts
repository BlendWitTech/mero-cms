import { Injectable } from '@nestjs/common';
import * as OTPAuth from 'otpauth';
import * as QRCode from 'qrcode';

@Injectable()
export class SecurityService {
    generateSecret() {
        return new OTPAuth.Secret({ size: 20 }).base32;
    }

    async generateQrCode(email: string, secret: string) {
        const totp = new OTPAuth.TOTP({
            issuer: 'Mero CMS',
            label: email,
            algorithm: 'SHA1',
            digits: 6,
            period: 30,
            secret: secret,
        });

        const uri = totp.toString();
        return QRCode.toDataURL(uri);
    }

    verifyToken(token: string, secret: string) {
        const totp = new OTPAuth.TOTP({
            issuer: 'Mero CMS',
            algorithm: 'SHA1',
            digits: 6,
            period: 30,
            secret: secret,
        });

        const delta = totp.validate({
            token: token,
            window: 1, // Allow for 1 period of clock drift
        });

        return delta !== null;
    }
}

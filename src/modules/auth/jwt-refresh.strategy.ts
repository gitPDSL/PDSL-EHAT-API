import { PassportStrategy } from '@nestjs/passport';
import { Strategy, ExtractJwt } from 'passport-jwt';
import { Injectable } from '@nestjs/common';

@Injectable()
export class JwtRefreshStrategy extends PassportStrategy(Strategy, 'jwt-refresh') {
    constructor() {
        super({
            jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
            secretOrKey: process.env.JWT_ACCESS_SECRET,
            expireIn: process.env.JWT_REFRESH_EXPIRE_TIME || '30m',
            passReqToCallback: true,
        });
    }

    async validate(req, payload: any) {
        const refreshToken = req.get('Authorization')?.replace('Bearer ', '').trim();
        return { ...payload, refreshToken };
    }
}

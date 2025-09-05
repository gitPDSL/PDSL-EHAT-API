import { ForbiddenException, Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ACCOUNT_STATUS } from 'src/constants/account.constants';
import { LoginUserDto } from '../dto/login-user.dto';
import { UserService } from 'src/modules/users/services/user.service';
import * as bcrypt from 'bcrypt';

@Injectable()
export class AuthService {
    constructor(
        private jwtService: JwtService,
        public userService: UserService,
    ) { }
    async signIn(loginUserDto: LoginUserDto) {
        const user = await this.userService.findByEmailAndPassword(loginUserDto.email, loginUserDto.password);
        if (!user)
            throw new UnauthorizedException();
        if (user.status !== ACCOUNT_STATUS.ACTIVE) {
            await this.userService.sendVerificationMail(user)
            throw new UnauthorizedException('User is not active');
        }
        const tokens = await this.getTokens(user?._id, user.email);
        await this.updateRefreshToken(user?._id, tokens.refreshToken);
        return tokens;

    }
    async getTokens(userId: string, email: string) {
        const payload = { sub: userId, email };

        const [accessToken, refreshToken] = await Promise.all([
            this.jwtService.signAsync(payload, {
                expiresIn: process.env.JWT_ACCESS_EXPIRE_TIME || '15m',
            }),
            this.jwtService.signAsync(payload, {
                expiresIn: process.env.JWT_REFRESH_EXPIRE_TIME || '7d',
            }),
        ]);

        return { accessToken, refreshToken };
    }

    async updateRefreshToken(userId: string, token: string) {
        const hashed = await bcrypt.hash(token, 10);
        await this.userService.update(userId, { refreshToken: hashed });
    }

    async refreshTokens(userId: string, refreshToken: string) {
        const user = await this.userService.findById(userId, true);
        if (!user || !user.refreshToken) throw new ForbiddenException('Access Denied');

        const matches = await bcrypt.compare(refreshToken, user.refreshToken);
        if (!matches) throw new ForbiddenException('Invalid refresh token');

        const tokens = await this.getTokens(user.id, user.email || '');
        await this.updateRefreshToken(user.id, tokens.refreshToken);

        return tokens;
    }
    async verify(decoded: any) {
        const user = await this.userService.findById(decoded.sub, true);
        // console.log(user)
        if (!user || !user.email || user.email != decoded.email) throw new ForbiddenException('Invalid token');

        return this.userService.update(decoded.sub, { status: ACCOUNT_STATUS.ACTIVE });
    }
    async forgotPassword(email: string) {
        const user = await this.userService.findOne({ email });
        if (!user) throw new ForbiddenException('Invalid email');

        await this.userService.sendForgotPasswordMail(user);
        return { message: "Reset password link sent to your email id." }
    }
    async resetPassword(decoded: any, password: string) {
        const user = await this.userService.findById(decoded.sub, true);
        if (!user || !user.email || user.email != decoded.email) throw new ForbiddenException('Invalid token');

        return this.userService.update(decoded.sub, { password });
    }
}

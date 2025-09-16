import { Injectable, NestMiddleware, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Request, Response, NextFunction } from 'express';
import { UserService } from 'src/modules/users/services/user.service';

@Injectable()
export class AuthMiddleware implements NestMiddleware {
  constructor(
    private jwtService: JwtService,
    private userService: UserService
  ) { }
  async use(req: Request, res: Response, next: NextFunction) {
    if (req.headers.authorization) {
      const token = req.headers.authorization.split(' ')[1];
      try {
        // console.log('Verifying JWT token:', token);
        // Verify the token using the secret for access tokens
        const decoded: any = await this.jwtService.verifyAsync(token);
        console.log(decoded, new Date(decoded.exp * 1000), new Date())
        req['user'] = await this.userService.findById(decoded.sub);
      } catch (e) {
        try {
          // console.log('Verifying JWT token:', token);
          // Verify the token using the secret for refresh tokens
          const decoded: any = await this.jwtService.verifyAsync(token);
          // console.log(decoded, new Date(decoded.exp * 1000), new Date())
          req['user'] = await this.userService.findById(decoded.sub);
        } catch (error) {
          console.error('JWT verification failed:', error.errors || error.message);
          throw new UnauthorizedException(error.errors || error.message || 'Invalid token');
        }
      }
      next();
    } else {
      throw new UnauthorizedException('Authorization header is missing')
    }
  }
}

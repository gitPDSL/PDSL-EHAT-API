import { PipeTransform, Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';

@Injectable()
export class JwtParserPipe implements PipeTransform {
  constructor(private readonly jwtService: JwtService) {}

  transform(value: string) {
    // value is "Bearer <token>" if passed from @Headers decorator
    if (!value) {
      throw new UnauthorizedException('JWT token missing');
    }

    const token = value.replace('Bearer ', '');
    try {
      const decoded = this.jwtService.verify(token);
      return decoded;
    } catch (err) {
      throw new UnauthorizedException('Invalid token');
    }
  }
}

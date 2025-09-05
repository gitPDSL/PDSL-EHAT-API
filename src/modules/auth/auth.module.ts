import { Module } from '@nestjs/common';
import { AuthService } from './service/auth.service';
import { AuthController } from './auth.controller';
import { UsersModule } from 'src/modules/users/users.module';
import { JwtRefreshStrategy } from './jwt-refresh.strategy';
import { JwtAccessStrategy } from './jwt-access.strategy';
import { JwtParserPipe } from 'src/pipes/jwt-parser.pipe';

@Module({
  imports: [UsersModule],
  providers: [AuthService, JwtAccessStrategy, JwtRefreshStrategy, JwtParserPipe],
  controllers: [AuthController]
})
export class AuthModule { }

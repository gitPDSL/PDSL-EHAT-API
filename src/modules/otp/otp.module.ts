import { Module } from '@nestjs/common';
import { OtpsController } from './otp.controller';
import { OtpService } from './services/otp.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { OtpEntity } from 'src/database/postgres/entities/otp.entity';
@Module({
    imports: [TypeOrmModule.forFeature([OtpEntity])],
    controllers: [OtpsController],
    providers: [OtpService],
    exports: [OtpService]
})
export class OtpsModule {
}

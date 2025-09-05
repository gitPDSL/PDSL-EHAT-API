import { MiddlewareConsumer, Module, NestModule, RequestMethod } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import configuration from './config/configuration';
import { ConfigModule } from '@nestjs/config';
import { UsersModule } from './modules/users/users.module';
import { APP_INTERCEPTOR } from '@nestjs/core';
import { LoggerInterceptor } from './interceptors/logger.interceptor';
import { AuthMiddleware } from './middlewares/auth/auth.middleware';
import { AuthModule } from './modules/auth/auth.module';
import { TransfromInterceptor } from './interceptors/transform.interceptor';
import { MailModule } from './mail/mail.module';
import { PostgresModule } from './database/postgres/postgres.module';
import { ClientsModule } from './modules/clients/clients.module';
import { DepartmentsModule } from './modules/departments/departments.module';
import { ProjectsModule } from './modules/projects/projects.module';
import { RolesModule } from './modules/roles/roles.module';
import { TimesheetsModule } from './modules/timesheets/timesheets.module';
import { TimesheetStatusesModule } from './modules/timesheetStatuses/timesheet-statuses.module';
import { ProjectUsersModule } from './modules/projectUsers/project-users.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      envFilePath: ['.env', '.dev.env'],
      // ignoreEnvFile: true,
      load: configuration,
      cache: true,
      expandVariables: true,
      isGlobal: true
    }),
    JwtModule.register({
      global: true,
      secret: process.env.JWT_ACCESS_SECRET,
      signOptions: { expiresIn: process.env.JWT_EXPIRE_TIME || '60s' },
    }),
    MailModule.forRoot(),
    PostgresModule.forRootAsync(),
    AuthModule,
    RolesModule,
    ClientsModule,
    DepartmentsModule,
    ProjectsModule,
    ProjectUsersModule,
    TimesheetStatusesModule,
    TimesheetsModule,
    UsersModule,

  ],
  controllers: [],
  providers: [
    { provide: APP_INTERCEPTOR, useClass: LoggerInterceptor },
    { provide: APP_INTERCEPTOR, useClass: TransfromInterceptor },
  ],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(AuthMiddleware).exclude({ path: '/auth/login', method: RequestMethod.POST }, { path: '/auth', method: RequestMethod.POST }, { path: '/auth/verify/(.*)', method: RequestMethod.PUT }, { path: '/auth/forgot-password', method: RequestMethod.POST }, { path: '/auth/reset-password/(.*)', method: RequestMethod.PUT }, { path: '/roles', method: RequestMethod.GET }).forRoutes('*')
  }
}
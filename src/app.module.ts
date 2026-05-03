import { MiddlewareConsumer, Module, NestModule, RequestMethod } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { ScheduleModule } from '@nestjs/schedule';
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';
import configuration from './config/configuration';
import { ConfigModule } from '@nestjs/config';
import { UsersModule } from './modules/users/users.module';
import { APP_GUARD, APP_INTERCEPTOR } from '@nestjs/core';
import { LoggerInterceptor } from './interceptors/logger.interceptor';
import { RolesGuard } from './guards/roles.guard';
import { EmploymentTypeGuard } from './guards/employment.guard';
import { AuthMiddleware } from './middlewares/auth/auth.middleware';
import { RequestIdMiddleware } from './middlewares/request-id/request-id.middleware';
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
import { ProjectStatusesModule } from './modules/projectStatus/project-statuses.module';
import { SendMailModule } from './modules/mail/mail.module';
import { LeavesModule } from './modules/leave/leaves.module';
import { LeaveBalancesModule } from './modules/leaveBalance/leave-balances.module';
import { LeaveTypesModule } from './modules/leaveType/leave-types.module';
import { LeaveStatusesModule } from './modules/leaveStatus/leave-statuses.module';
import { HealthModule } from './modules/health/health.module';
import { AuditModule } from './modules/audit/audit.module';
import { PayrollModule } from './modules/payroll/payroll.module';
import { NotificationsModule } from './modules/notifications/notifications.module';
import { ExportsModule } from './modules/exports/exports.module';
import { HolidaysModule } from './modules/holidays/holidays.module';
import { BootstrapModule } from './bootstrap/bootstrap.module';
import { CorrectionsModule } from './modules/corrections/corrections.module';
import { AllocationsModule } from './modules/allocations/allocations.module';
import { DashboardsModule } from './modules/dashboards/dashboards.module';
import { PanelModule } from './modules/panel/panel.module';
import { PayslipsModule } from './modules/payslips/payslips.module';

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
    ScheduleModule.forRoot(),
    // We deliberately do NOT register a global throttle. Behind Render's
    // reverse proxy every request shares one apparent IP from the API's
    // perspective, so a global per-IP limit punishes legitimate SPA usage
    // (notifications polling + a busy page like Approvals can fire 20+
    // requests in a burst). Instead we apply a tight bucket only to the
    // login + forgot-password endpoints via @Throttle on the handler;
    // those are what actually need brute-force protection.
    ThrottlerModule.forRoot([
        { name: 'auth', limit: 10, ttl: 15 * 60_000 },
    ]),
    MailModule.forRoot(),
    PostgresModule.forRootAsync(),
    AuthModule,
    RolesModule,
    ClientsModule,
    DepartmentsModule,
    ProjectStatusesModule,
    ProjectsModule,
    ProjectUsersModule,
    TimesheetStatusesModule,
    TimesheetsModule,
    UsersModule,
    SendMailModule,
    LeavesModule,
    LeaveBalancesModule,
    LeaveTypesModule,
    LeaveStatusesModule,
    HealthModule,
    AuditModule,
    PayrollModule,
    NotificationsModule,
    ExportsModule,
    HolidaysModule,
    BootstrapModule,
    CorrectionsModule,
    AllocationsModule,
    DashboardsModule,
    PanelModule,
    PayslipsModule,
  ],
  controllers: [],
  providers: [
    { provide: APP_INTERCEPTOR, useClass: LoggerInterceptor },
    { provide: APP_INTERCEPTOR, useClass: TransfromInterceptor },
    { provide: APP_GUARD, useClass: ThrottlerGuard },
    { provide: APP_GUARD, useClass: RolesGuard },
    { provide: APP_GUARD, useClass: EmploymentTypeGuard },
  ],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(RequestIdMiddleware).forRoutes('*');
    consumer.apply(AuthMiddleware).exclude({ path: '/auth/login', method: RequestMethod.POST }, { path: '/auth/logout', method: RequestMethod.POST }, { path: '/auth', method: RequestMethod.POST }, { path: '/auth/verify/(.*)', method: RequestMethod.PUT }, { path: '/auth/forgot-password', method: RequestMethod.POST }, { path: '/auth/reset-password/(.*)', method: RequestMethod.PUT }, { path: '/auth/refresh', method: RequestMethod.GET }, { path: '/roles', method: RequestMethod.GET }, { path: '/health', method: RequestMethod.GET }, { path: '/ready', method: RequestMethod.GET }).forRoutes('*')
  }
}
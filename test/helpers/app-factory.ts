import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { MailerService } from '@nestjs-modules/mailer';
import { AppModule } from '../../src/app.module';
import { AllExceptionsFilter } from '../../src/filters/http-exception.filter';
import { MongoExceptionFilter } from '../../src/filters/mongo-exception.filter';

const fakeMailer = {
    verifyAllTransporters: jest.fn().mockResolvedValue(undefined),
    sendMail: jest.fn().mockResolvedValue({ messageId: 'fake-test' }),
    addTransporter: jest.fn(),
    verifyTransporter: jest.fn().mockResolvedValue(undefined),
};

export async function createTestApp(): Promise<{ app: INestApplication; dataSource: DataSource }> {
    const moduleFixture: TestingModule = await Test.createTestingModule({
        imports: [AppModule],
    })
        .overrideProvider(MailerService)
        .useValue(fakeMailer)
        .compile();

    const app = moduleFixture.createNestApplication();
    app.setGlobalPrefix('api');
    app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));
    app.useGlobalFilters(new MongoExceptionFilter(), new AllExceptionsFilter());
    await app.init();

    const dataSource = app.get(DataSource);
    return { app, dataSource };
}

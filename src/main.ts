import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ConfigService } from '@nestjs/config/dist/config.service';
import { createServer as createHttpServer } from 'http';
import { createServer as createHttpsServer } from 'https';
import { ValidationPipe } from '@nestjs/common';
import { HttpsOptions } from '@nestjs/common/interfaces/external/https-options.interface';
import { ExpressAdapter } from '@nestjs/platform-express';
import { resolve } from 'path';
import { readFileSync } from 'fs';
import * as express from 'express';
import { AllExceptionsFilter } from './filters/http-exception.filter';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { MongoExceptionFilter } from './filters/mongo-exception.filter';

async function bootstrap() {
  // The HTTPS listener below is currently disabled. In production we
  // sit behind a TLS-terminating proxy (Render, Nginx, etc.), so the
  // cert files are not present on disk and reading them would crash
  // the process before Nest can start. Only attempt the read in dev,
  // where local certs may exist for HTTPS testing.
  let httpsOptions: HttpsOptions | null = null;
  if (process.env.NODE_ENV !== 'production') {
    try {
      httpsOptions = {
        key: readFileSync(resolve(__dirname, '../cert/key.pem')),
        cert: readFileSync(resolve(__dirname, '../cert/certificate.pem')),
      };
    } catch {
      httpsOptions = null;
    }
  }
  void httpsOptions;
  const server = express()
  const app = await NestFactory.create(AppModule, new ExpressAdapter(server));
  app.useGlobalPipes(new ValidationPipe({
    whitelist: true,
    // forbidNonWhitelisted: true,
    transform: true,
    // transformOptions: {
    //   enableImplicitConversion: true,
    // },
  }))
  // app.useGlobalInterceptors(new LoggerInterceptor());
  app.useGlobalFilters(new MongoExceptionFilter(), new AllExceptionsFilter())
  const config = app.get(ConfigService);
  const port = config.get<number>('APP_PORT', 3000)
  app.setGlobalPrefix('api');
  app.enableCors({
    origin: [process.env.APP_URL, 'http://localhost:4200'], // or '*'
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS',
    allowedHeaders: 'Content-Type, Authorization, X-Requested-With',
    credentials: true, // if using cookies
    preflightContinue: false, // let Nest handle it
    optionsSuccessStatus: 204
  });
  if (process.env.NODE_ENV !== 'production') {
    const swagerConfig = new DocumentBuilder()
      .setTitle('PDSL EHAT API')
      .setDescription('PDSL EHAT API description here. [Download Swagger JSON](./docs-json)')
      .setVersion('1.0')
      .addBearerAuth()
      // .addTag('Admin')
      .build();
    const documentFactory = SwaggerModule.createDocument(app, swagerConfig);
    SwaggerModule.setup('api/docs', app, documentFactory);
  }

  await app.init();
  createHttpServer(server).listen(port);
  // createHttpsServer(httpsOptions, server).listen(443);
}
bootstrap();

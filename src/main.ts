import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ConfigService } from '@nestjs/config';
import * as cookieParser from 'cookie-parser';
import { ValidationPipe } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import * as helmet from 'helmet';
import * as Sentry from '@sentry/node';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  const configService = app.get(ConfigService)
  const cookieSecret = configService.get('COOKIE_SECRET')
  app.use(cookieParser(cookieSecret))

  app.enableCors({
    origin: [/pepijncolenbrander\.com$/, /localhost(:\d+)?$/],
    credentials: true,
  });

  // Register Sentry error tracking
  Sentry.init({
    dsn: configService.get('SENTRY_DSN'),
  });

  app.useGlobalPipes(new ValidationPipe());

  const config = new DocumentBuilder()
    .setTitle('RD Client API')
    .setDescription('API For RD Client')
    .setVersion('1.0')
    .addTag('Auth')
    .addTag('RD')
    .addBearerAuth()
    .build();
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('docs', app, document);

  // Use helmet
  /* @ts-ignore */
  app.use(helmet());

  await app.listen(3000);
}
bootstrap();

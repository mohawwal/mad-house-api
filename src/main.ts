import * as dotenv from 'dotenv';
dotenv.config();

import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import * as cookieParser from 'cookie-parser';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.use(cookieParser());

  app.enableCors({
    origin: [
      'http://localhost:8000',
      'http://localhost:4000',
      'https://admin-mad-house-vvxm.vercel.app',
      'https://4-tl.vercel.app',
    ],
    credentials: true,
  });

  const config = new DocumentBuilder()
    .setTitle('madhouse API')
    .setDescription('The madhouse API endpoints')
    .setVersion('1.0')
    .addTag('madhouse')
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api', app, document);

  const port = process.env.PORT || 3000;
  await app.listen(port);

  console.log(`Application is running on: ${await app.getUrl()}`);
  console.log(`Swagger UI is available at: ${await app.getUrl()}/api`);
}
bootstrap();

import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import * as cookieParser from 'cookie-parser';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.enableCors({
    origin: [
      'http://localhost:8000',
      'http://localhost:4000',
      'https://admin-mad-house-vvxm.vercel.app',
      'https://4-tl.vercel.app/',
    ],
    credentials: true,
  });

  app.use(cookieParser());
  app.setGlobalPrefix('api');

  const port = process.env.PORT ?? 3000;
  await app.listen(port);
}
bootstrap();

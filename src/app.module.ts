import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthModule } from './auth/auth.module';
import { DatabaseModule } from './database/database.module';
import { EventsModule } from './events/events.module';
import { CloudinaryService } from './cloudinary/cloudinary.service';
import { CloudinaryModule } from './cloudinary/cloudinary.module';
import { MulterModule } from '@nestjs/platform-express';
import { ScheduleModule } from '@nestjs/schedule';
import { ContactsModule } from './contacts/contacts.module';
import { JwtModule } from '@nestjs/jwt';
import { MailerModule } from '@nestjs-modules/mailer';
import { ConfigModule, ConfigService } from '@nestjs/config';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    AuthModule,
    DatabaseModule,
    EventsModule,
    CloudinaryModule,
    JwtModule.registerAsync({
      useFactory: (configService: ConfigService) => ({
        global: true,
        secret: configService.get('JWT_SECRET'),
        signOptions: { expiresIn: configService.get('JWT_EXPIRESIN') },
      }),
      inject: [ConfigService],
    }),
    MailerModule.forRootAsync({
      useFactory: (configService: ConfigService) => {
        const user = configService.get<string>('GMAIL_APP_USER');
        const pass = configService.get<string>('GMAIL_APP_PASSWORD');

        console.log('=== MAILER CONFIG DEBUG (inside factory) ===');
        console.log('GMAIL_APP_USER:', user);
        console.log('GMAIL_APP_PASSWORD exists:', !!pass);
        console.log('GMAIL_APP_PASSWORD length:', pass);

        return {
          transport: {
            host: 'smtp.gmail.com',
            port: 587,
            secure: false,
            auth: {
              user,
              pass,
            },
            logger: true,
            debug: true,
          },
        };
      },
      inject: [ConfigService],
    }),
    MulterModule.register({
      limits: {
        fileSize: 5 * 1024 * 1024,
      },
      fileFilter: (req, file, cb) => {
        if (file.mimetype.match(/\/(jpg|jpeg|png|gif|webp)$/)) {
          cb(null, true);
        } else {
          cb(new Error('Only image files are allowed!'), false);
        }
      },
    }),
    ScheduleModule.forRoot(),
    ContactsModule,
  ],
  controllers: [AppController],
  providers: [AppService, CloudinaryService],
})
export class AppModule {
  constructor(private configService: ConfigService) {
    console.log('=== MAILER CONFIG DEBUG (constructor) ===');
    console.log('GMAIL_APP_USER:', this.configService.get('GMAIL_APP_USER'));
    console.log(
      'GMAIL_APP_PASSWORD exists:',
      !!this.configService.get('GMAIL_APP_PASSWORD'),
    );
  }
}

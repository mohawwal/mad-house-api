import { Module } from '@nestjs/common';
import { EventsService } from './events.service';
import { EventsController } from './events.controller';
import { DatabaseModule } from 'src/database/database.module';
import { CloudinaryModule } from 'src/cloudinary/cloudinary.module';
import { IsVerifiedGuard } from './isVerified.guard';
import { DatabaseService } from 'src/database/database.service';
import { JwtService } from '@nestjs/jwt';
import { EventsCron } from './events.cron';

@Module({
  imports: [DatabaseModule, CloudinaryModule],
  controllers: [EventsController],
  providers: [
    EventsService,
    IsVerifiedGuard,
    DatabaseService,
    JwtService,
    EventsCron,
  ],
  exports: [EventsService],
})
export class EventsModule {}

import { Module } from '@nestjs/common';
import { ContactsService } from './contacts.service';
import { ContactsController } from './contacts.controller';
import { DatabaseModule } from 'src/database/database.module';
import { JwtModule } from '@nestjs/jwt';
import { EmailModule } from 'src/email/email.module';

@Module({
  imports: [DatabaseModule, JwtModule, EmailModule],
  controllers: [ContactsController],
  providers: [ContactsService],
})
export class ContactsModule {}

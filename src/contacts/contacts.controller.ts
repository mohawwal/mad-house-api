import {
  Controller,
  Post,
  Body,
  Get,
  UseGuards,
  Query,
  Delete,
  Param,
} from '@nestjs/common';
import { ContactsService } from './contacts.service';
import { Prisma } from '@prisma/client';
import { AuthGuard } from 'src/auth/auth.guard';
import { IsVerifiedGuard } from 'src/events/isVerified.guard';

@Controller('contacts')
export class ContactsController {
  constructor(private readonly contactsService: ContactsService) {}

  @Post()
  create(@Body() createContactDto: Prisma.ContactCreateInput) {
    return this.contactsService.create(createContactDto);
  }

  @Get()
  @UseGuards(AuthGuard, IsVerifiedGuard)
  findAll(
    @Query('page') page: number = 1,
    @Query('limit') limit: number = 10,
    @Query('email') email?: string,
  ) {
    return this.contactsService.findAll(+page, +limit, email);
  }

  @Delete(':id')
  @UseGuards(AuthGuard, IsVerifiedGuard)
  remove(@Param('id') id: string) {
    return this.contactsService.remove(+id);
  }
}

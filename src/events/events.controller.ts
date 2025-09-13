import {
  Controller,
  Post,
  Body,
  Get,
  Param,
  Patch,
  Delete,
  Query,
  UseInterceptors,
  UploadedFile,
  UseGuards,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { EventsService } from './events.service';
import { Prisma } from '@prisma/client';
import { IsVerifiedGuard } from './isVerified.guard';
import { AuthGuard } from 'src/auth/auth.guard';

@Controller('events')
export class EventsController {
  constructor(private readonly eventsService: EventsService) {}

  @Post()
  @UseGuards(AuthGuard, IsVerifiedGuard)
  @UseInterceptors(FileInterceptor('image'))
  async create(
    @Body() createEventDto: Omit<Prisma.EventCreateInput, 'image'>,
    @UploadedFile() file?: Express.Multer.File,
  ) {
    return this.eventsService.create(createEventDto, file);
  }

  @Get()
  findAll(
    @Query('status')
    status?: 'UPCOMING' | 'ONGOING' | 'COMPLETED' | 'CANCELLED',
    @Query('page') page: number = 1,
    @Query('limit') limit: number = 10,
  ) {
    return this.eventsService.findAll(status, +page, +limit);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.eventsService.findOne(+id);
  }

  @Patch(':id')
  @UseGuards(AuthGuard, IsVerifiedGuard)
  @UseInterceptors(FileInterceptor('image'))
  async update(
    @Param('id') id: string,
    @Body() updateEventDto: Omit<Prisma.EventUpdateInput, 'image'>,
    @UploadedFile() file?: Express.Multer.File,
  ) {
    return this.eventsService.update(+id, updateEventDto, file);
  }

  @Delete(':id')
  @UseGuards(AuthGuard, IsVerifiedGuard)
  remove(@Param('id') id: string) {
    return this.eventsService.remove(+id);
  }
}

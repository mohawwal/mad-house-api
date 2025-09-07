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
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { EventsService } from './events.service';
import { Prisma } from '@prisma/client';

@Controller('events')
export class EventsController {
  constructor(private readonly eventsService: EventsService) {}

  @Post()
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
  ) {
    return this.eventsService.findAll(status);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.eventsService.findOne(+id);
  }

  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() updateEventDto: Prisma.EventCreateInput,
  ) {
    return this.eventsService.update(+id, updateEventDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.eventsService.remove(+id);
  }
}

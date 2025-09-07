import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { DatabaseService } from 'src/database/database.service';
import { CloudinaryService } from 'src/cloudinary/cloudinary.service';

@Injectable()
export class EventsService {
  constructor(
    private readonly databaseService: DatabaseService,
    private readonly cloudinaryService: CloudinaryService,
  ) {}

  async create(
    createEventDto: Omit<Prisma.EventCreateInput, 'image'>,
    file?: Express.Multer.File,
  ) {
    let imageUrl: string | null = null;

    if (file) {
      const uploadResult = await this.cloudinaryService.uploadImage(file);
      imageUrl = uploadResult.secure_url;
    }

    return this.databaseService.event.create({
      data: {
        ...createEventDto,
        image: imageUrl,
      },
    });
  }

  async findAll(status?: 'UPCOMING' | 'ONGOING' | 'COMPLETED' | 'CANCELLED') {
    if (status)
      return this.databaseService.event.findMany({
        where: { status },
      });
    return this.databaseService.event.findMany();
  }

  async findOne(id: number) {
    return this.databaseService.event.findUnique({
      where: { id },
    });
  }

  async update(id: number, updateEventDto: Prisma.EventCreateInput) {
    return this.databaseService.event.update({
      where: { id },
      data: updateEventDto,
    });
  }

  async remove(id: number) {
    return this.databaseService.event.delete({
      where: { id },
    });
  }
}

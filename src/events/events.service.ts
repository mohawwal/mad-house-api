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

  async findAll(
    status?: 'UPCOMING' | 'ONGOING' | 'COMPLETED' | 'CANCELLED',
    page: number = 1,
    limit: number = 10,
  ) {
    const skip = (page - 1) * limit;
    const where = status ? { status } : {};

    const [data, total] = await this.databaseService.$transaction([
      this.databaseService.event.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      this.databaseService.event.count({ where }),
    ]);
    return {
      data,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async findOne(id: number) {
    return this.databaseService.event.findUnique({
      where: { id },
    });
  }

  async update(id: number, updateEventDto: Prisma.EventUpdateInput) {
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

  async updateEventStatuses() {
    const now = new Date();

    const updated = await this.databaseService.event.updateMany({
      where: {
        endDate: { lt: now },
        status: 'ONGOING',
      },
      data: {
        status: 'COMPLETED',
      },
    });

    return { updated: updated.count };
  }
}

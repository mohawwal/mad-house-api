import { BadRequestException, Injectable } from '@nestjs/common';
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
    createEventDto: Omit<Prisma.EventCreateInput, 'image'> & { image?: string },
    file?: Express.Multer.File,
  ) {
    let imageUrl: string | null = null;

    if (createEventDto.status === 'UPCOMING') {
      const startDate =
        typeof createEventDto.startDate === 'string'
          ? new Date(createEventDto.startDate)
          : createEventDto.startDate;

      const now = new Date();

      if (startDate < now) {
        throw new BadRequestException(
          'Start date cannot be in the past for UPCOMING events.',
        );
      }
    }

    if (file) {
      const uploadResult = await this.cloudinaryService.uploadImage(file);
      imageUrl = uploadResult.secure_url;
    } else if (createEventDto.image) {
      imageUrl = createEventDto.image;
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

  async update(
    id: number,
    updateEventDto: Omit<Prisma.EventUpdateInput, 'image'>,
    file?: Express.Multer.File,
  ) {
    const updateData: Prisma.EventUpdateInput = { ...updateEventDto };

    if (file) {
      const uploadResult = await this.cloudinaryService.uploadImage(file);
      updateData.image = uploadResult.secure_url;
    }

    if (updateEventDto.status === 'UPCOMING' && updateEventDto.startDate) {
      const startDate =
        typeof updateEventDto.startDate === 'string'
          ? new Date(updateEventDto.startDate)
          : (updateEventDto.startDate as Date);

      const now = new Date();

      if (startDate < now) {
        throw new BadRequestException(
          'Start date cannot be in the past for UPCOMING events.',
        );
      }
    }

    return this.databaseService.event.update({
      where: { id },
      data: updateData,
    });
  }

  async remove(id: number) {
    return this.databaseService.event.delete({
      where: { id },
    });
  }

  async updateEventStatuses() {
    const now = new Date();

    const ongoingUpdate = await this.databaseService.event.updateMany({
      where: {
        startDate: { lte: now },
        status: 'UPCOMING',
      },
      data: { status: 'ONGOING' },
    });

    const completedUpdate = await this.databaseService.event.updateMany({
      where: {
        endDate: { lt: now },
        status: 'ONGOING',
      },
      data: { status: 'COMPLETED' },
    });

    return {
      updatedToOngoing: ongoingUpdate.count,
      updatedToCompleted: completedUpdate.count,
    };
  }
}

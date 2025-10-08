import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma, Contact } from '@prisma/client';
import { DatabaseService } from 'src/database/database.service';
import { JwtService } from '@nestjs/jwt';
import { EmailService } from 'src/email/email.service';
import { ConfigService } from '@nestjs/config';

interface ConfirmTokenPayload {
  contactId: number;
  iat: number;
  exp: number;
}

@Injectable()
export class ContactsService {
  constructor(
    private readonly databaseService: DatabaseService,
    private readonly emailService: EmailService,
    private readonly jwtService: JwtService,
    private readonly configSevice: ConfigService,
  ) {}

  async create(
    createContactDto: Prisma.ContactCreateInput,
  ): Promise<{ success: boolean; data: Contact; message: string }> {
    const existingContact = await this.databaseService.contact.findUnique({
      where: { email: createContactDto.email.toLowerCase() },
    });

    if (existingContact && existingContact.status === 'ACTIVE') {
      throw new ConflictException('Email is already subscribed to our events');
    }

    let contact: Contact;

    if (existingContact && existingContact.status === 'INACTIVE') {
      contact = await this.databaseService.contact.update({
        where: { id: existingContact.id },
        data: {
          email: createContactDto.email.toLowerCase(),
          firstname: createContactDto.firstname,
          lastname: createContactDto.lastname,
          status: 'INACTIVE',
        },
      });
    } else {
      contact = await this.databaseService.contact.create({
        data: {
          email: createContactDto.email.toLowerCase(),
          firstname: createContactDto.firstname,
          lastname: createContactDto.lastname,
          status: 'INACTIVE',
        },
      });
    }

    if (!contact) {
      throw new BadRequestException('Failed to create contact');
    }

    const token = this.jwtService.sign(
      { contactId: contact.id },
      {
        secret: this.configSevice.get<string>('JWT_SECRET'),
        expiresIn: '24h',
      },
    );

    const baseUrl = this.configSevice.get<string>('APP_URL');
    const confirmUrl = `${baseUrl}/contacts/confirm?token=${token}`;

    try {
      await this.emailService.sendEmail({
        to: contact.email,
        subject: 'Confirm your subscription to MadHouse',
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; padding: 20px;">
            <h2 style="color: #EB8014;">Confirm Your Subscription</h2>
            <p style="color: #333; line-height: 1.5;">
              Before we send you any emails, we need to confirm your subscription.
            </p>
            <a href="${confirmUrl}" 
              style="display:inline-block; background:#EB8014; color:white; 
              padding:12px 24px; border-radius:6px; text-decoration:none; font-weight:bold;">
              Confirm Subscription
            </a>
            <p style="margin-top:20px; color:#666; font-size:14px;">
              If you did not subscribe to MadHouse Events, you can safely ignore this email.
            </p>
          </div>
        `,
      });
    } catch (emailError) {
      console.error('Failed to send confirmation email:', emailError);
      throw new BadRequestException(
        'Failed to send confirmation email. Please try again later.',
      );
    }

    return {
      success: true,
      data: contact,
      message:
        'Subscription created. Please confirm your email to activate subscription.',
    };
  }

  async confirmSubscription(token: string) {
    try {
      const payload = this.jwtService.verify<ConfirmTokenPayload>(token, {
        secret: this.configSevice.get<string>('JWT_SECRET'),
      });

      const contact = await this.databaseService.contact.update({
        where: { id: payload.contactId },
        data: { status: 'ACTIVE' },
      });

      return {
        success: true,
        message: 'Subscription confirmed successfully!',
        data: contact,
      };
    } catch (err) {
      console.error('Error confirming subscription:', err);
      throw new BadRequestException('Invalid or expired confirmation link');
    }
  }

  async findAll(
    page: number = 1,
    limit: number = 10,
    email?: string,
    status?: 'ACTIVE' | 'INACTIVE',
  ) {
    const skip = (page - 1) * limit;

    const where: Prisma.ContactWhereInput = {};
    if (email) {
      where.email = {
        contains: email.toLowerCase(),
        mode: 'insensitive',
      };
    }
    if (status) {
      where.status = status;
    }

    const [data, total] = await this.databaseService.$transaction([
      this.databaseService.contact.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      this.databaseService.contact.count({ where }),
    ]);

    return {
      data,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async findById(id: number): Promise<{ success: boolean; data: Contact }> {
    const contact = await this.databaseService.contact.findUnique({
      where: { id },
    });

    if (!contact) {
      throw new NotFoundException(`Contact with ID ${id} not found`);
    }

    return {
      success: true,
      data: contact,
    };
  }

  async remove(id: number) {
    const existingContact = await this.databaseService.contact.findUnique({
      where: { id },
    });

    if (!existingContact) {
      throw new NotFoundException('Contact not found');
    }

    return this.databaseService.contact.delete({
      where: { id },
    });
  }

  async sendBulkEmail(
    subject: string,
    htmlContent: string,
    batchSize: number = 50,
  ) {
    const totalContacts = await this.databaseService.contact.count({
      where: { status: 'ACTIVE' },
    });

    if (totalContacts === 0) {
      throw new BadRequestException(
        'No active contacts found to send emails to',
      );
    }

    const totalBatches = Math.ceil(totalContacts / batchSize);
    const results = {
      totalContacts,
      successCount: 0,
      failedCount: 0,
      failedEmails: [] as string[],
    };

    for (let batch = 0; batch < totalBatches; batch++) {
      const skip = batch * batchSize;

      const contacts = await this.databaseService.contact.findMany({
        skip,
        take: batchSize,
        where: { status: 'ACTIVE' },
        select: {
          email: true,
          firstname: true,
          lastname: true,
        },
      });

      const emailPromises = contacts.map(async (contact) => {
        try {
          const personalizedContent = htmlContent
            .replace(/{{firstname}}/g, contact.firstname || 'Subscriber')
            .replace(/{{lastname}}/g, contact.lastname || '')
            .replace(/{{email}}/g, contact.email);

          await this.emailService.sendEmail({
            to: contact.email,
            subject,
            html: personalizedContent,
          });

          results.successCount++;
          return { email: contact.email, success: true };
        } catch (error) {
          console.error(`Failed to send email to ${contact.email}:`, error);
          results.failedCount++;
          results.failedEmails.push(contact.email);
          return { email: contact.email, success: false };
        }
      });

      await Promise.allSettled(emailPromises);

      // delay between batches
      // if (batch < totalBatches - 1) {
      //   await new Promise((resolve) => setTimeout(resolve, 1000));
      // }
    }

    return {
      success: true,
      message: `Bulk email sending completed. ${results.successCount} sent successfully, ${results.failedCount} failed.`,
      results,
    };
  }

  async updateStatus(
    id: number,
    status: 'ACTIVE' | 'INACTIVE',
  ): Promise<{ success: boolean; message: string; data: Contact }> {
    const contact = await this.databaseService.contact.findUnique({
      where: { id },
    });

    if (!contact) {
      throw new NotFoundException(`Contact with ID ${id} not found`);
    }

    const updated = await this.databaseService.contact.update({
      where: { id },
      data: { status },
    });

    return {
      success: true,
      message: `Contact status updated to ${status}`,
      data: updated,
    };
  }
}

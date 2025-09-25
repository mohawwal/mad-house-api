import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma, Contact } from '@prisma/client';
import { DatabaseService } from 'src/database/database.service';
import { MailerService } from '@nestjs-modules/mailer';
import { JwtService } from '@nestjs/jwt';

interface ConfirmTokenPayload {
  contactId: number;
  iat: number;
  exp: number;
}

@Injectable()
export class ContactsService {
  constructor(
    private readonly databaseService: DatabaseService,
    private readonly mailerService: MailerService,
    private readonly jwtService: JwtService,
  ) {}

  async create(
    createContactDto: Prisma.ContactCreateInput,
  ): Promise<{ success: boolean; data: Contact; message: string }> {
    const existingContact = await this.databaseService.contact.findUnique({
      where: { email: createContactDto.email.toLowerCase() },
    });

    if (existingContact) {
      throw new ConflictException('Email is already subscribed to our events');
    }

    const contact = await this.databaseService.contact.create({
      data: {
        ...createContactDto,
        email: createContactDto.email.toLowerCase(),
      },
    });

    if (!contact) {
      throw new BadRequestException('Failed to create contact');
    }

    const token = this.jwtService.sign(
      { contactId: contact.id },
      { expiresIn: '24h' },
    );

    const baseUrl = process.env.APP_URL;
    const confirmUrl = `${baseUrl}/contacts/confirm?token=${token}`;

    try {
      await this.mailerService.sendMail({
        from: 'MadHouse Events <aanileleye@gmail.com>',
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
      const payload = this.jwtService.verify<ConfirmTokenPayload>(token);

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
    // Get total count of contacts
    const totalContacts = await this.databaseService.contact.count();

    if (totalContacts === 0) {
      throw new BadRequestException('No contacts found to send emails to');
    }

    const totalBatches = Math.ceil(totalContacts / batchSize);
    const results = {
      totalContacts,
      successCount: 0,
      failedCount: 0,
      failedEmails: [] as string[],
    };

    // Process contacts in batches to avoid overwhelming the email service
    for (let batch = 0; batch < totalBatches; batch++) {
      const skip = batch * batchSize;

      const contacts = await this.databaseService.contact.findMany({
        skip,
        take: batchSize,
        select: {
          email: true,
          firstname: true,
          lastname: true,
        },
      });

      // Send emails concurrently within each batch
      const emailPromises = contacts.map(async (contact) => {
        try {
          // Personalize the email content by replacing placeholders
          const personalizedContent = htmlContent
            .replace(/{{firstname}}/g, contact.firstname || 'Subscriber')
            .replace(/{{lastname}}/g, contact.lastname || '')
            .replace(/{{email}}/g, contact.email);

          await this.mailerService.sendMail({
            from: 'MadHouse Events <aanileleye@gmail.com>',
            to: contact.email,
            subject: subject,
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

      // Wait for current batch to complete before moving to next
      await Promise.allSettled(emailPromises);

      // Optional: Add delay between batches to be respectful to email service
      if (batch < totalBatches - 1) {
        await new Promise((resolve) => setTimeout(resolve, 1000));
      }
    }

    return {
      success: true,
      message: `Bulk email sending completed. ${results.successCount} sent successfully, ${results.failedCount} failed.`,
      results,
    };
  }
}

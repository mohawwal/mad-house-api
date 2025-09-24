import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma, Contact } from '@prisma/client';
import { DatabaseService } from 'src/database/database.service';
import { MailerService } from '@nestjs-modules/mailer';

@Injectable()
export class ContactsService {
  constructor(
    private readonly databaseService: DatabaseService,
    private readonly mailerService: MailerService,
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

    try {
      await this.mailerService.sendMail({
        from: 'MadHouse Events <aanileleye@gmail.com>',
        to: contact.email,
        subject: 'Welcome to MadHouse Events!',
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
            <div style="text-align: center; margin-bottom: 30px;">
              <h1 style="color: #EB8014; margin-bottom: 10px;">Welcome to MadHouse Events!</h1>
              <p style="color: #666; font-size: 18px;">Thank you for subscribing to our events</p>
            </div>
            
            <div style="background-color: #f9f9f9; padding: 25px; border-radius: 8px; margin: 20px 0;">
              <h2 style="color: #333; margin-top: 0;">Hi ${contact.firstname || 'Subscriber'}!</h2>
              <p style="color: #555; line-height: 1.6;">
                You have successfully subscribed to MadHouse Events. We're excited to have you join our community!
              </p>
              <p style="color: #555; line-height: 1.6;">
                You'll now receive updates about our latest events, exclusive offers, and exciting announcements 
                directly to your inbox.
              </p>
            </div>

            <div style="background-color: #EB8014; color: white; padding: 20px; border-radius: 8px; text-align: center; margin: 20px 0;">
              <h3 style="margin: 0 0 10px 0;">🎃Stay Mad! 🤪Stay Connected!</h3>
              <p style="margin: 0; opacity: 0.9;">
                Keep an eye on your inbox for upcoming events and special announcements.
              </p>
            </div>

            <hr style="margin: 30px 0; border: none; border-top: 1px solid #eee;">
            
            <div style="text-align: center;">
              <p style="color: #999; font-size: 12px; margin: 0;">
                This is an automated confirmation email. Please do not reply to this email.
              </p>
              <p style="color: #999; font-size: 12px; margin: 5px 0 0 0;">
                © ${new Date().getFullYear()} MadHouse Events. All rights reserved.
              </p>
            </div>
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
        'Successfully subscribed to MadHouse events. Confirmation email sent!',
    };
  }

  async findAll(page: number = 1, limit: number = 10, email?: string) {
    const skip = (page - 1) * limit;

    const where: Prisma.ContactWhereInput = {};
    if (email) {
      where.email = {
        contains: email.toLowerCase(),
        mode: 'insensitive',
      };
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

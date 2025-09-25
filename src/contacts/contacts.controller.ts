import {
  Controller,
  Post,
  Body,
  Get,
  UseGuards,
  Query,
  Delete,
  Param,
  BadRequestException,
  Res,
} from '@nestjs/common';
import { ContactsService } from './contacts.service';
import { Prisma } from '@prisma/client';
import { AuthGuard } from 'src/auth/auth.guard';
import { IsVerifiedGuard } from 'src/events/isVerified.guard';
import { Response } from 'express';

@Controller('contacts')
export class ContactsController {
  constructor(private readonly contactsService: ContactsService) {}

  @Post()
  @UseGuards(AuthGuard, IsVerifiedGuard)
  create(@Body() createContactDto: Prisma.ContactCreateInput) {
    return this.contactsService.create(createContactDto);
  }

  @Get('confirm')
  async confirmSubscription(
    @Query('token') token: string,
    @Res() res: Response,
  ) {
    if (!token) {
      return res.status(400).send('Confirmation token is required');
    }

    try {
      await this.contactsService.confirmSubscription(token);

      return res.send(`
        <html>
          <head>
            <title>Subscription Confirmed</title>
            <style>
              body {
                margin: 0;
                padding: 0;
                font-family: Arial, sans-serif;
                background-color: #ffffff;
                display: flex;
                justify-content: center;
                align-items: center;
                height: 100vh;
              }
              .container {
                text-align: center;
              }
              h1 {
                font-size: 20px;
                color:rgb(16, 16, 16);
                margin-bottom: 16px;
              }
              a {
                font-size: 14px;
                color:rgba(0, 0, 0, 0.48);
                text-decoration: underline;
              }
            </style>
          </head>
          <body>
            <div class="container">
              <h1>🔥 You are now a subscriber</h1>
              <a href="https://4-tl.vercel.app">
                You can start receiving mails from madhouse
              </a>
            </div>
          </body>
        </html>
      `);
    } catch (err) {
      console.error('Error confirming subscription:', err);
      return res.status(400).send(`
        <html>
          <head>
            <title>Madhouse Subscription</title>
            <style>
              body {
                margin: 0;
                padding: 0;
                font-family: Arial, sans-serif;
                background-color: #ffffff;
                display: flex;
                justify-content: center;
                align-items: center;
                height: 100vh;
              }
              .container {
                text-align: center;
              }
              h1 {
                font-size: 20px;
                color:rgb(16, 16, 16);
                margin-bottom: 16px;
              }
              a {
                font-size: 14px;
                color:rgba(0, 0, 0, 0.48);
                text-decoration: underline;
              }
            </style>
          </head>
          <body>
            <div class="container">
              <h1>🤬 Invalid or expired confirmation link</h1>
              <a href="https://4-tl.vercel.app">
                You can try subscribing again.
              </a>
            </div>
          </body>
        </html>
      `);
    }
  }

  @Get()
  @UseGuards(AuthGuard, IsVerifiedGuard)
  findAll(
    @Query('page') page: number = 1,
    @Query('limit') limit: number = 10,
    @Query('email') email?: string,
    @Query('status') status?: 'ACTIVE' | 'INACTIVE',
  ) {
    return this.contactsService.findAll(+page, +limit, email, status);
  }

  @Delete(':id')
  @UseGuards(AuthGuard, IsVerifiedGuard)
  remove(@Param('id') id: string) {
    return this.contactsService.remove(+id);
  }

  @Post('bulk-email')
  @UseGuards(AuthGuard, IsVerifiedGuard)
  sendBulkEmail(
    @Body()
    bulkEmailDto: {
      subject: string;
      htmlContent: string;
      batchSize?: number;
    },
  ) {
    const { subject, htmlContent, batchSize = 50 } = bulkEmailDto;

    if (!subject || !htmlContent) {
      throw new BadRequestException('Subject and message are required');
    }

    return this.contactsService.sendBulkEmail(subject, htmlContent, batchSize);
  }
}

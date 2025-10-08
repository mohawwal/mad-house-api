import { Injectable } from '@nestjs/common';
import * as nodemailer from 'nodemailer';
import { ConfigService } from '@nestjs/config';
import { sendEmailDto } from 'src/email/dto/email.dto';

@Injectable()
export class EmailService {
  constructor(private readonly configService: ConfigService) {}
  emailTransport() {
    const host = this.configService.get<string>('GMAIL_HOST');
    const port = this.configService.get<number>('GMAIL_PORT');

    console.log('📧 Email Configuration:', {
      host,
      port,
      secure: port === 465,
    });

    const transporter = nodemailer.createTransport({
      host: this.configService.get<string>('GMAIL_HOST'),
      port: this.configService.get<number>('GMAIL_PORT'),
      secure: true,
      auth: {
        user: this.configService.get<string>('GMAIL_APP_USER'),
        pass: this.configService.get<string>('GMAIL_APP_PASSWORD'),
      },
    });
    return transporter;
  }

  async sendEmail(dto: sendEmailDto) {
    const { to, subject, html } = dto;

    const transport = this.emailTransport();

    const options: nodemailer.SendMailOptions = {
      from: this.configService.get<string>('GMAIL_APP_USER'),
      to: to,
      subject: subject,
      html: html,
    };
    try {
      const result = await transport.sendMail(options);
      console.log('✅ Email sent successfully:', result.messageId);
      return result;
    } catch (err) {
      console.log(err);
    }
  }
}

import { Injectable } from '@nestjs/common';
import * as nodemailer from 'nodemailer';
import { ConfigService } from '@nestjs/config';
import { sendEmailDto } from 'src/email/dto/email.dto';

@Injectable()
export class EmailService {
  constructor(private readonly configService: ConfigService) {}

  private emailTransport() {
    const host =
      this.configService.get<string>('GMAIL_HOST') || 'smtp.gmail.com';
    const port = Number(this.configService.get<number>('GMAIL_PORT'));
    const secure = port === 465;

    console.log('Email Config:', { host, port, secure });

    return nodemailer.createTransport({
      host,
      port,
      secure,
      auth: {
        user: this.configService.get<string>('GMAIL_APP_USER'),
        pass: this.configService.get<string>('GMAIL_APP_PASSWORD'),
      },
      tls: {
        rejectUnauthorized: false,
      },
    });
  }

  async sendEmail(dto: sendEmailDto) {
    const { to, subject, html } = dto;

    const transport = this.emailTransport();

    const options: nodemailer.SendMailOptions = {
      from: this.configService.get<string>('GMAIL_APP_USER'),
      to,
      subject,
      html,
    };

    try {
      const result = await transport.sendMail(options);
      console.log('✅ Email sent successfully:', result.messageId);
      return result;
    } catch (err) {
      console.error('❌ Email send failed:', err);
      throw err;
    }
  }
}

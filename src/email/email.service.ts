import { Injectable } from '@nestjs/common';
import * as nodemailer from 'nodemailer';
import { ConfigService } from '@nestjs/config';
import { sendEmailDto } from 'src/email/dto/email.dto';

@Injectable()
export class EmailService {
  constructor(private readonly configService: ConfigService) {}
  emailTransport() {
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
      await transport.sendMail(options);
    } catch (err) {
      console.log(err);
    }
  }
}

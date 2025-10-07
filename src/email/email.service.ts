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
      secure: false,
      auth: {
        user: this.configService.get<string>('GMAIL_APP_USER'),
        pass: this.configService.get<string>('GMAIL_APP_PASSWORD'),
      },
    });
    return transporter;
  }

  async sendEmail(dto: sendEmailDto) {
    const { recipients, subject, html } = dto;

    const transport = this.emailTransport();

    const options: nodemailer.SendMailOptions = {
      from: this.configService.get<string>('GMAIL_APP_USER'),
      to: recipients,
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

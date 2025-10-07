import { IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class sendEmailDto {
  @IsNotEmpty()
  recipients: string;

  @IsString()
  subject: string;

  @IsString()
  html: string;

  @IsOptional()
  @IsString()
  text?: string;
}

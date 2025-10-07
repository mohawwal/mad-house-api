import { IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class sendEmailDto {
  @IsNotEmpty()
  to: string;

  @IsString()
  subject: string;

  @IsString()
  html: string;

  @IsOptional()
  @IsString()
  text?: string;
}

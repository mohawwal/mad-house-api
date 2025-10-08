import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { DatabaseService } from 'src/database/database.service';
import * as bcrypt from 'bcrypt';
import { JwtService } from '@nestjs/jwt';
import { generateOTP } from './auth.helper';
import { Response } from 'express';
import sendToken from './sendToken';
import { RefreshTokenPayload } from './user.decorator';
import { EmailService } from 'src/email/email.service';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class AuthService {
  constructor(
    private readonly databaseService: DatabaseService,
    private readonly jwtService: JwtService,
    private readonly emailService: EmailService,
    private readonly configService: ConfigService,
  ) {}

  async signUp(
    createAuthDto: Prisma.superUserCreateInput,
  ): Promise<{ success: boolean; data: any; message: string }> {
    const existingUser = await this.databaseService.superUser.findUnique({
      where: { email: createAuthDto.email },
    });

    if (existingUser) {
      throw new ConflictException('User already exist');
    }

    const saltRound = 12;
    const hashedPassword = await bcrypt.hash(createAuthDto.password, saltRound);

    const user = await this.databaseService.superUser.create({
      data: {
        ...createAuthDto,
        password: hashedPassword,
      },
      select: {
        id: true,
        username: true,
        email: true,
        isVerified: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    return {
      success: true,
      data: user,
      message: 'User created successfully',
    };
  }

  // Login
  async login(
    email: string,
    password: string,
    response: Response,
  ): Promise<void> {
    const user = await this.databaseService.superUser.findUnique({
      where: { email: email.toLowerCase() },
    });

    if (!user) {
      throw new UnauthorizedException('Invalid email or password');
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);

    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid email or password');
    }

    sendToken(user, 200, response, this.jwtService, 'Login successful');
  }

  // Get OTP
  async getOtp(
    email: string,
  ): Promise<{ success: boolean; message: string; email: string }> {
    const user = await this.databaseService.superUser.findUnique({
      where: { email },
    });

    if (!user) {
      throw new UnauthorizedException('User does not exist');
    }

    const otp = generateOTP();
    const otpExpiry = new Date(Date.now() + 60 * 60 * 1000);

    await this.databaseService.superUser.update({
      where: { email },
      data: {
        otp,
        otpExpiry,
      },
    });

    try {
      await this.emailService.sendEmail({
        to: email,
        subject: 'MadHouse Admin - Password Reset OTP',
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #333;">MadHouse Account One Time Password</h2>
            <p>You have requested to reset your password. Please use the following OTP to proceed:</p>
            <div style="background-color: #f4f4f4; padding: 20px; text-align: center; margin: 20px 0;">
              <h1 style="color: #EB8014; font-size: 32px; letter-spacing: 8px; margin: 0;">${otp}</h1>
            </div>
            <p><strong>This OTP is valid for 30 minutes only.</strong></p>
            <p>If you didn't request this password reset, please ignore this email.</p>
            <hr style="margin: 30px 0;">
            <p style="color: #666; font-size: 12px;">This is an automated message, please do not reply.</p>
          </div>
        `,
      });

      return {
        success: true,
        message: 'OTP sent successfully to your email',
        email,
      };
    } catch (error) {
      await this.databaseService.superUser.update({
        where: { email },
        data: {
          otp: null,
          otpExpiry: null,
        },
      });

      console.error(error);
      throw new BadRequestException('Failed to send email. Please try again.');
    }
  }

  // Verify OTP
  async verifyOtp(
    email: string,
    otp: string,
  ): Promise<{ success: boolean; message: string; email: string }> {
    const user = await this.databaseService.superUser.findUnique({
      where: { email },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    if (!user.otp || !user.otpExpiry) {
      throw new BadRequestException('No OTP found. Please request a new one.');
    }

    if (user.otp !== otp) {
      throw new BadRequestException('Invalid OTP');
    }

    if (new Date() > user.otpExpiry) {
      await this.databaseService.superUser.update({
        where: { email },
        data: {
          otp: null,
          otpExpiry: null,
        },
      });

      throw new BadRequestException(
        'OTP has expired. Please request a new one.',
      );
    }

    await this.databaseService.superUser.update({
      where: { email },
      data: {
        otp: null,
        otpExpiry: null,
        isVerified: true,
      },
    });

    return {
      success: true,
      message: 'OTP verified successfully. Your account is now verified.',
      email,
    };
  }

  // Reset password
  async resetPassword(
    email: string,
    otp: string,
    newPassword: string,
  ): Promise<{ success: boolean; message: string }> {
    const user = await this.databaseService.superUser.findUnique({
      where: { email },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    if (!user.otp || !user.otpExpiry) {
      throw new BadRequestException('No OTP found. Please request a new one.');
    }

    if (user.otp !== otp) {
      throw new BadRequestException('Invalid OTP');
    }

    if (new Date() > user.otpExpiry) {
      await this.databaseService.superUser.update({
        where: { email },
        data: {
          otp: null,
          otpExpiry: null,
        },
      });

      throw new BadRequestException(
        'OTP has expired. Please request a new one.',
      );
    }

    const saltRound = 12;
    const hashedPassword = await bcrypt.hash(newPassword, saltRound);

    await this.databaseService.superUser.update({
      where: { email },
      data: {
        password: hashedPassword,
        otp: null,
        otpExpiry: null,
        isVerified: true,
      },
    });

    return {
      success: true,
      message:
        'Password reset successfully. You can now login with your new password.',
    };
  }

  // Logout
  logout(response: Response): { success: boolean; message: string } {
    console.log('Logout request received');

    const isProduction =
      this.configService.get<string>('NODE_ENV') === 'production';

    response.cookie('token', '', {
      expires: new Date(0),
      httpOnly: true,
      secure: isProduction,
      path: '/',
    });

    return {
      success: true,
      message: 'Logged out successfully',
    };
  }

  //me.
  async getCurrentUser(id: number) {
    const user = await this.databaseService.superUser.findUnique({
      where: { id },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    return {
      id: user.id,
      email: user.email,
      username: user.username,
      isVerified: user.isVerified,
    };
  }

  //Refresh Token
  async refreshToken(refreshToken: string, response: Response): Promise<void> {
    try {
      const payload = await this.jwtService.verifyAsync<RefreshTokenPayload>(
        refreshToken,
        {
          secret: this.configService.get<string>('JWT_REFRESH_SECRET'),
        },
      );

      const user = await this.databaseService.superUser.findUnique({
        where: { id: payload.sub },
      });

      if (!user) {
        throw new UnauthorizedException('User not found');
      }

      sendToken(
        user,
        200,
        response,
        this.jwtService,
        'Token refreshed successfully',
      );
    } catch (error) {
      if (error instanceof Error && error.name === 'TokenExpiredError') {
        throw new UnauthorizedException(
          'Refresh token expired, please log in again',
        );
      }
      throw new UnauthorizedException('Invalid refresh token');
    }
  }
}

import { Controller, Post, Body, Res, Get, UseGuards } from '@nestjs/common';
import { AuthService } from './auth.service';
import { Prisma } from '@prisma/client';
import type { Response } from 'express';
import { AuthGuard } from './auth.guard';
import { User } from './user.decorator';

interface JwtPayload {
  id: number;
  email: string;
  username: string;
  isVerified: boolean;
  sub: number;
  iat?: number;
  exp?: number;
}
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('signup')
  signUp(@Body() createAuthDto: Prisma.superUserCreateInput) {
    return this.authService.signUp(createAuthDto);
  }

  @Post('login')
  login(
    @Body() loginAuthDto: { email: string; password: string },
    @Res({ passthrough: true }) response: Response,
  ) {
    return this.authService.login(
      loginAuthDto.email,
      loginAuthDto.password,
      response,
    );
  }

  @Post('get-otp')
  getOtp(@Body() getOtpAuthDto: { email: string }) {
    return this.authService.getOtp(getOtpAuthDto.email);
  }

  @Post('verify-otp')
  verifyOtp(@Body() verifyOtpDto: { email: string; otp: string }) {
    return this.authService.verifyOtp(verifyOtpDto.email, verifyOtpDto.otp);
  }

  @Post('reset-password')
  resetPassword(
    @Body()
    resetPasswordDto: {
      email: string;
      otp: string;
      newPassword: string;
    },
  ) {
    return this.authService.resetPassword(
      resetPasswordDto.email,
      resetPasswordDto.otp,
      resetPasswordDto.newPassword,
    );
  }

  @Post('logout')
  logout(@Res({ passthrough: true }) response: Response) {
    return this.authService.logout(response);
  }

  // @Get('me')
  // @UseGuards(AuthGuard)
  // getMe(@User() user: JwtPayload) {
  //   return {
  //     success: true,
  //     data: {
  //       id: user.id,
  //       email: user.email,
  //       username: user.username,
  //       isVerified: user.isVerified,
  //     },
  //   };
  // }

  @Get('me')
  @UseGuards(AuthGuard)
  async getMe(@User() user: JwtPayload) {
    const data = await this.authService.getCurrentUser(user.id);
    return {
      success: true,
      data,
    };
  }
}

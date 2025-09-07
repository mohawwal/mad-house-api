import {
  Controller,
  Post,
  Body,
  Res,
  Get,
  Req,
  UseGuards,
  UnauthorizedException,
} from '@nestjs/common';
import { AuthService } from './auth.service';
import { Prisma } from '@prisma/client';
import type { Response, Request } from 'express';
import { JwtAuthGuard } from './guards/jwt-auth.guard';

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

  @Get('me')
  @UseGuards(JwtAuthGuard)
  getMe(@Req() request: Request) {
    if (!request.user) {
      throw new UnauthorizedException('User not found in request');
    }
    return this.authService.getMe(request.user);
  }
}

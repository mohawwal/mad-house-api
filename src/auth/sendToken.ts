import { JwtService } from '@nestjs/jwt';
import { Response } from 'express';

interface User {
  id: number;
  email: string;
  username: string;
  isVerified: boolean;
}

const sendToken = (
  user: User,
  statusCode: number,
  res: Response,
  jwtService: JwtService,
  message: string = 'Login successful',
) => {
  const payload = {
    id: user.id,
    email: user.email,
    username: user.username,
    isVerified: user.isVerified,
    sub: user.id,
  };

  const accessToken = jwtService.sign(payload, {
    expiresIn: process.env.ACCESS_EXPIRES_TIME || '15m',
    secret: process.env.JWT_SECRET,
  });

  const refreshToken = jwtService.sign(
    { sub: user.id },
    {
      expiresIn: process.env.REFRESH_EXPIRES_TIME || '30d',
      secret: process.env.JWT_REFRESH_SECRET,
    },
  );

  const isProd = process.env.NODE_ENV === 'production';

  res.cookie('token', accessToken, {
    httpOnly: false,
    secure: isProd,
    sameSite: isProd ? 'none' : 'lax',
    path: '/',
    maxAge: 15 * 60 * 1000,
  });

  res.cookie('refreshToken', refreshToken, {
    httpOnly: true,
    secure: isProd,
    sameSite: isProd ? 'none' : 'lax',
    path: '/',
    maxAge: 30 * 24 * 60 * 60 * 1000,
  });

  res.status(statusCode).json({
    success: true,
    accessToken,
    refreshToken,
    user: {
      id: user.id,
      email: user.email,
      username: user.username,
      isVerified: user.isVerified,
    },
    message,
  });

  return accessToken;
};

export default sendToken;

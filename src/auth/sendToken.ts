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

  const token = jwtService.sign(payload, {
    expiresIn: process.env.JWT_EXPIRESIN || '1h',
    secret: process.env.JWT_SECRET,
  });

  const refreshToken = jwtService.sign(
    { sub: user.id },
    {
      expiresIn: process.env.EXPIRES_TIME || '7d',
      secret: process.env.JWT_REFRESH_SECRET,
    },
  );

  const isProd = process.env.NODE_ENV === 'production';

  res.cookie('token', token, {
    httpOnly: true,
    secure: isProd,
    sameSite: isProd ? 'none' : 'lax',
    path: '/',
    maxAge: 60 * 60 * 1000,
  });

  const responseData = {
    success: true,
    token,
    refreshToken,
    user: {
      id: user.id,
      email: user.email,
      username: user.username,
      isVerified: user.isVerified,
    },
    message,
  };

  res.status(statusCode).json(responseData);
  return token;
};

export default sendToken;

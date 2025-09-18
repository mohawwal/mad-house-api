import { JwtService } from '@nestjs/jwt';
import { Response } from 'express';
import { parseTimeToMs } from './auth.helper';
import type { CookieOptions } from 'express';

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
    expiresIn: process.env.EXPIRES_TIME || '7d',
    secret: process.env.JWT_SECRET,
  });

  const tokenMs = parseTimeToMs(process.env.EXPIRES_TIME || '7d');
  const tokenExpires = new Date(Date.now() + tokenMs);

  const isProd = process.env.NODE_ENV === 'production';

  // Enhanced cookie options for Safari compatibility
  const cookieOptions: CookieOptions = {
    expires: tokenExpires,
    httpOnly: true,
    secure: isProd, // Must be true in production for SameSite=None
    sameSite: isProd ? 'none' : 'lax', // 'none' requires secure=true
    path: '/',
    // Add domain if in production and you have a specific domain
    ...(isProd &&
      process.env.COOKIE_DOMAIN && {
        domain: process.env.COOKIE_DOMAIN,
      }),
  };

  // Set the main token cookie
  res.cookie('token', token, cookieOptions);

  // Alternative: Also set a fallback cookie with different settings for Safari
  if (isProd) {
    // Fallback cookie with SameSite=lax for Safari
    res.cookie('token_fallback', token, {
      ...cookieOptions,
      sameSite: 'lax',
      // Remove secure requirement for fallback in case of issues
      secure: false,
    });
  }

  res.status(statusCode).json({
    success: true,
    token,
    user: {
      id: user.id,
      email: user.email,
      username: user.username,
      isVerified: user.isVerified,
    },
    message,
  });

  return token;
};

export default sendToken;

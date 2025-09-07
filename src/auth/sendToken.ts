import { JwtService } from '@nestjs/jwt';
import { Response } from 'express';
import { parseTimeToMs } from './auth.helper';

interface User {
  id: number;
  email: string;
  username: string;
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
    sub: user.id,
  };

  // Generate single token (like your Node.js version)
  const token = jwtService.sign(payload, {
    expiresIn: process.env.EXPIRES_TIME || '7d',
    secret: process.env.JWT_SECRET,
  });

  const tokenMs = parseTimeToMs(process.env.EXPIRES_TIME || '7d');
  const tokenExpires = new Date(Date.now() + tokenMs);

  // Cookie options
  const cookieOptions = {
    expires: tokenExpires,
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    path: '/',
  };

  // Set single cookie
  res.cookie('token', token, cookieOptions);

  res.status(statusCode).json({
    success: true,
    token,
    user: {
      id: user.id,
      email: user.email,
      username: user.username,
    },
    message,
  });

  return token;
};

export default sendToken;

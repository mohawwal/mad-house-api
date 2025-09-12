import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Request } from 'express';

interface RequestWithCookies extends Request {
  cookies: {
    token?: string;
    [key: string]: any;
  };
  user?: JwtPayload;
}

interface JwtPayload {
  id: number;
  email: string;
  username: string;
  isVerified: boolean;
  sub: number;
  iat?: number;
  exp?: number;
}

@Injectable()
export class AuthGuard implements CanActivate {
  constructor(private readonly jwtService: JwtService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<RequestWithCookies>();

    const token = request.cookies?.token;

    if (!token) {
      throw new UnauthorizedException('No token found in cookies');
    }

    try {
      const payload = await this.jwtService.verifyAsync<JwtPayload>(token, {
        secret: process.env.JWT_SECRET,
      });

      request.user = payload;
      return true;
    } catch (error) {
      console.log('Token verification failed:', error);
      throw new UnauthorizedException('Invalid or expired token');
    }
  }
}

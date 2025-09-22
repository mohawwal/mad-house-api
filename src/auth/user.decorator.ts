import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { Request } from 'express';

interface JwtPayload {
  id: number;
  email: string;
  username: string;
  sub: number;
  iat?: number;
  exp?: number;
}

export interface RefreshTokenPayload {
  sub: number;
  iat?: number;
  exp?: number;
}

interface RequestWithUser extends Request {
  user: JwtPayload;
}

export const User = createParamDecorator(
  (data: keyof JwtPayload | undefined, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest<RequestWithUser>();
    const user = request.user;

    return data ? user?.[data] : user;
  },
);

import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import type { RequestWithUser, AuthenticatedUser } from './auth.interface';

export const User = createParamDecorator(
  (data: keyof AuthenticatedUser | undefined, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest<RequestWithUser>();
    const user = request.user;

    return data ? user?.[data] : user;
  },
);

import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { DatabaseService } from 'src/database/database.service';

interface JwtPayload {
  id: number;
  email: string;
  username: string;
  isVerified: boolean;
  sub: number;
  iat?: number;
  exp?: number;
}

interface RequestWithUser extends Request {
  user: JwtPayload;
}

@Injectable()
export class IsVerifiedGuard implements CanActivate {
  constructor(private readonly databaseService: DatabaseService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<RequestWithUser>();
    const user = request.user;

    const userFromDB = await this.databaseService.superUser.findUnique({
      where: { id: user.id },
      select: {
        isVerified: true,
      },
    });
    if (!userFromDB || !userFromDB.isVerified) {
      throw new ForbiddenException(
        'Account is not verified. Please verify your account to access this resource.',
      );
    }

    return true;
  }
}

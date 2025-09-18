import {
  Injectable,
  CanActivate,
  ExecutionContext,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';

interface RequestWithCookies {
  cookies: { [key: string]: string };
  headers: { [key: string]: string };
  user?: any;
}

interface JwtPayload {
  id: number;
  email: string;
  username: string;
  isVerified: boolean;
  sub: number;
}

@Injectable()
export class AuthGuard implements CanActivate {
  constructor(private readonly jwtService: JwtService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<RequestWithCookies>();

    // Try multiple methods to get the token for Safari compatibility
    const token = this.extractTokenFromRequest(request);

    if (!token) {
      throw new UnauthorizedException('No token found');
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

  private extractTokenFromRequest(request: RequestWithCookies): string | null {
    // Method 1: Try primary token cookie
    if (request.cookies?.token) {
      return request.cookies.token;
    }

    // Method 2: Try fallback token cookie (for Safari issues)
    if (request.cookies?.token_fallback) {
      return request.cookies.token_fallback;
    }

    // Method 3: Try Authorization header as fallback
    const authHeader = request.headers?.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      return authHeader.substring(7);
    }

    // Method 4: Try custom header (you can set this from frontend)
    if (request.headers?.['x-auth-token']) {
      return request.headers['x-auth-token'];
    }

    return null;
  }
}

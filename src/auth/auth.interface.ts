export interface JwtPayload {
  id: number;
  email: string;
  iat?: number;
  exp?: number;
}

export interface AuthenticatedUser {
  id: number;
  username: string;
  email: string;
  isVerified: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface RequestWithUser extends Request {
  user: AuthenticatedUser;
  cookies: { [key: string]: string };
}

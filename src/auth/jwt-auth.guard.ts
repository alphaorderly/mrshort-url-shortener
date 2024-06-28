import {
  Injectable,
  ExecutionContext,
  UnauthorizedException,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { Reflector } from '@nestjs/core';
import { Request } from 'express';
import { JwtService, TokenExpiredError } from '@nestjs/jwt';

@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {
  constructor(
    private reflector: Reflector,
    private readonly jwtService: JwtService,
  ) {
    super();
  }

  async canActivate(context: ExecutionContext) {
    const request = context.switchToHttp().getRequest<Request>();
    const response = context.switchToHttp().getResponse();

    const token = request.cookies['jwt'];
    if (!token) {
      throw new UnauthorizedException();
    }

    try {
      const payload = await this.jwtService.verifyAsync(token);
      request.user = {
        userId: payload.sub,
        username: payload.username,
      };
      return true;
    } catch (e) {
      if (e instanceof TokenExpiredError) {
        const refreshToken = request.cookies['jwt-refresh'];
        if (!refreshToken) {
          throw new UnauthorizedException();
        }

        try {
          const payload = await this.jwtService.verifyAsync(refreshToken, {
            secret: process.env.JWT_REFRESH_SECRET,
          });

          const newPayload = {
            sub: payload.sub,
            username: payload.username,
          };

          const newToken = this.jwtService.sign(newPayload);

          response.cookie('jwt', newToken, { httpOnly: true });
          request.user = {
            userId: payload.sub,
            username: payload.username,
          };
          return true;
        } catch (e) {
          throw new UnauthorizedException();
        }
      } else {
        throw new UnauthorizedException();
      }
    }
  }
}

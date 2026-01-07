import { Injectable, UnauthorizedException } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { Observable } from 'rxjs';

@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {
  canActivate(
    context: any,
  ): boolean | Promise<boolean> | Observable<boolean> {
    return super.canActivate(context);
  }

  handleRequest(err: any, user: any, info: any) {
    if (err) {
      throw new UnauthorizedException(err.message || 'Authentication failed');
    }
    
    if (!user) {
      let message = 'Authentication required';
      
      if (info) {
        if (info.name === 'TokenExpiredError') {
          message = 'Token has expired';
        } else if (info.name === 'JsonWebTokenError') {
          message = 'Invalid token';
        } else if (info.message) {
          message = info.message;
        }
      }
      
      throw new UnauthorizedException(message);
    }
    
    return user;
  }
}

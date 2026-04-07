import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  UnauthorizedException,
} from '@nestjs/common';

/**
 * AdminGuard — allows only users with isAdmin = true.
 *
 * MUST be used together with JwtAuthGuard so req.user is populated first:
 *
 *   @UseGuards(JwtAuthGuard, AdminGuard)
 *   @Post('admin/create')
 *   createSomething() { ... }
 *
 * Returns 401 if no user on request (JwtAuthGuard not applied first).
 * Returns 403 if user is authenticated but not admin.
 */
@Injectable()
export class AdminGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();
    const user = request.user;

    if (!user) {
      throw new UnauthorizedException('Authentication required');
    }

    if (!user.isAdmin) {
      throw new ForbiddenException('Admin access required');
    }

    return true;
  }
}

import { Injectable } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

/**
 * JwtAuthGuard — protects routes that require a valid JWT token.
 *
 * Usage:
 *   @UseGuards(JwtAuthGuard)
 *   @Get('profile')
 *   getProfile(@Request() req) { return req.user; }
 *
 * On success: req.user is populated with the User entity from JwtStrategy.validate()
 * On failure: 401 Unauthorized is returned automatically by Passport
 */
@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {}

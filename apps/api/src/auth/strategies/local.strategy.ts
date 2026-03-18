import { Injectable, UnauthorizedException } from '@nestjs/common'
import { PassportStrategy } from '@nestjs/passport'
import { Strategy } from 'passport-local'
import { AuthService } from '../auth.service'
import { User } from '../../users/entities/user.entity'

/**
 * LocalStrategy validates username+password during login.
 * It is only used once — when the user first logs in.
 * After that, JwtStrategy takes over for all subsequent requests.
 */
@Injectable()
export class LocalStrategy extends PassportStrategy(Strategy) {
  constructor(private readonly authService: AuthService) {
    super({
      // Tell passport-local to look for 'email' field instead of default 'username'
      usernameField: 'email',
    })
  }

  async validate(email: string, password: string): Promise<User> {
    const user = await this.authService.validateUser(email, password)

    if (!user) {
      throw new UnauthorizedException('Invalid email or password')
    }

    return user
  }
}
import {
  Controller,
  Post,
  Body,
  HttpCode,
  HttpStatus,
  UseGuards,
  Request,
  Get,
  Res,
  Patch,
} from "@nestjs/common";
import { Response } from "express";
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from "@nestjs/swagger";
import { AuthGuard } from "@nestjs/passport";
import { ConfigService } from "@nestjs/config";
import { AuthService } from "./auth.service";
import {
  RegisterDto,
  LoginDto,
  RefreshTokenDto,
  AuthResponseDto,
  UpdateMeDto,
} from "@adspectr/shared";

@ApiTags("Authentication")
@Controller("auth")
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly config: ConfigService,
  ) {}

  @Post("register")
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: "Register a new user account" })
  @ApiResponse({
    status: 201,
    description: "Account created successfully",
    type: AuthResponseDto,
  })
  @ApiResponse({ status: 409, description: "Email already in use" })
  async register(@Body() dto: RegisterDto): Promise<AuthResponseDto> {
    return this.authService.register(dto);
  }

  @Post("login")
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: "Login with email and password" })
  @ApiResponse({
    status: 200,
    description: "Login successful",
    type: AuthResponseDto,
  })
  @ApiResponse({ status: 401, description: "Invalid credentials" })
  async login(@Body() dto: LoginDto): Promise<AuthResponseDto> {
    return this.authService.login(dto);
  }

  @Post("refresh")
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: "Get new access token using refresh token" })
  @ApiResponse({ status: 200, description: "New access token issued" })
  @ApiResponse({ status: 401, description: "Invalid or expired refresh token" })
  async refresh(
    @Body() dto: RefreshTokenDto,
  ): Promise<{ accessToken: string }> {
    return this.authService.refreshToken(dto.token);
  }

  @Post("logout")
  @HttpCode(HttpStatus.NO_CONTENT)
  @UseGuards(AuthGuard("jwt"))
  @ApiBearerAuth()
  @ApiOperation({ summary: "Logout and invalidate refresh token" })
  @ApiResponse({ status: 204, description: "Logged out successfully" })
  async logout(@Request() req: any): Promise<void> {
    return this.authService.logout(req.user.id);
  }

  @Get("me")
  @UseGuards(AuthGuard("jwt"))
  @ApiBearerAuth()
  @ApiOperation({ summary: "Get current authenticated user" })
  @ApiResponse({ status: 200, description: "Current user data" })
  async me(@Request() req: any) {
    return req.user;
  }

  @Patch("me")
  @UseGuards(AuthGuard("jwt"))
  @ApiBearerAuth()
  @ApiOperation({ summary: "Update current authenticated user profile" })
  async updateMe(@Request() req: any, @Body() dto: UpdateMeDto) {
    return this.authService.updateMe(req.user.id, dto);
  }

  // ─── Google OAuth ───────────────────────────────────────────────────────────

  @Get("google")
  @UseGuards(AuthGuard("google"))
  @ApiOperation({ summary: "Redirect to Google OAuth consent screen" })
  googleLogin() {
    // Passport redirects — nothing to return
  }

  @Get("google/callback")
  @UseGuards(AuthGuard("google"))
  @ApiOperation({ summary: "Google OAuth callback" })
  googleCallback(@Request() req: any, @Res() res: Response) {
    const frontendUrl = this.config.get<string>(
      "FRONTEND_URL",
      "http://localhost:3000",
    );
    const auth = req.user as AuthResponseDto | undefined;
    if (!auth?.accessToken || !auth?.refreshToken) {
      const params = new URLSearchParams({
        error: "oauth_incomplete",
        detail: "Missing tokens after Google sign-in — check API logs.",
      });
      return res.redirect(`${frontendUrl}/auth/google/callback?${params.toString()}`);
    }

    const { accessToken, refreshToken, user } = auth;
    const isNew = !user;
    const params = new URLSearchParams({
      accessToken,
      refreshToken,
      isNew: String(isNew),
    });

    return res.redirect(`${frontendUrl}/auth/google/callback?${params.toString()}`);
  }

  // ─── Facebook OAuth ─────────────────────────────────────────────────────────

  @Get("facebook")
  @UseGuards(AuthGuard("facebook"))
  @ApiOperation({ summary: "Redirect to Facebook OAuth" })
  facebookLogin() {}

  @Get("facebook/callback")
  @UseGuards(AuthGuard("facebook"))
  @ApiOperation({ summary: "Facebook OAuth callback" })
  facebookCallback(@Request() req: any, @Res() res: Response) {
    const { accessToken, refreshToken } = req.user as AuthResponseDto;
    const frontendUrl = this.config.get<string>("FRONTEND_URL", "http://localhost:3000");
    const params = new URLSearchParams({ accessToken, refreshToken });
    // Reuse the same callback page as Google
    res.redirect(`${frontendUrl}/auth/google/callback?${params.toString()}`);
  }
}

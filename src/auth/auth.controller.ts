import { Controller, Post, Body, Res } from '@nestjs/common';
import { AuthService } from './auth.service';
import { Response } from 'express';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('login')
  async login(@Body() body, @Res() res: Response) {
    const hashedPassword = this.authService.hashPassword(body.password);

    const user = await this.authService.validateUser(
      body.username,
      hashedPassword,
    );

    if (!user) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    const token = await this.authService.login(user);
    res.cookie('jwt', token.access_token, { httpOnly: true });
    res.redirect('/');
  }
}

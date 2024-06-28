import {
  Controller,
  Post,
  Body,
  Res,
  Get,
  UseGuards,
  Req,
} from '@nestjs/common';
import { AuthService } from './auth.service';
import { Response } from 'express';
import { JwtAuthGuard } from './jwt-auth.guard';
import LoginBodyDto from './dtos/loginBody.dto';
import { ChangePasswordDto } from './dtos/changePassword.dto';
import { ErrorDto } from 'src/dtos/error.dto';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('login')
  async login(@Body() body: LoginBodyDto, @Res() res: Response) {
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
    res.cookie('jwt-refresh', token.refresh_token, { httpOnly: true });
    res.redirect('/');
  }

  @Get('logout')
  @UseGuards(JwtAuthGuard)
  async logout(@Res() res: Response) {
    res.clearCookie('jwt');
    res.clearCookie('jwt-refresh');
    res.redirect('/');
  }

  @Get('change-password')
  @UseGuards(JwtAuthGuard)
  async getChangePassword(@Res() res: Response) {
    res.render('change-password');
  }

  @Post('change-password')
  @UseGuards(JwtAuthGuard)
  async changePassword(
    @Body() body: ChangePasswordDto,
    @Res() res: Response,
    @Req() req,
  ) {
    const userId = req.user.userId;
    const changedUser = await this.authService.changePassword(
      userId,
      body.oldPassword,
      body.newPassword,
    );

    if (changedUser instanceof ErrorDto) {
      return res.status(400).json(changedUser);
    } else {
      return res.status(200).json('Password changed successfully');
    }
  }
}

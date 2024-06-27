import {
  Body,
  Controller,
  Delete,
  Get,
  Post,
  Render,
  Req,
  Res,
  UseGuards,
} from '@nestjs/common';
import { AppService } from './app.service';
import { JwtAuthGuard } from './auth/jwt-auth.guard';
import { Request, Response } from 'express';
import { shortenRequestDto } from './dtos/shortenRequest.dto';

@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get()
  @Render('index')
  @UseGuards(JwtAuthGuard)
  async index(@Req() req) {
    const userID = req.user.userId;

    const shortenedURLs = await this.appService.getAllShortenedURLs(userID);

    return {
      targetUrl: process.env.TARGET_URL,
      shortenedURLs: shortenedURLs,
      target: process.env.TARGET_URL,
    };
  }

  @Get('/:shortenedURL')
  async redirectToOriginalURL(@Req() req: Request, @Res() res: Response) {
    const shortenedURL = req.params.shortenedURL as string;

    const originalURL = await this.appService.getOriginalURL(shortenedURL);

    return res.redirect(originalURL);
  }

  @Post('/:shortenedURL')
  async redirectToOriginalURLWithPassword(
    @Req() req: Request,
    @Res() res: Response,
  ) {
    const password = req.body.password;

    const originalURL = await this.appService.getPasswordProtectedUrl(
      req.params.shortenedURL,
      password,
    );

    return res.redirect(originalURL);
  }

  @Delete('/:urlID')
  @UseGuards(JwtAuthGuard)
  async deleteShortenedURL(@Req() req, @Res() res: Response) {
    const userID = req.user.userId as number;
    const urlID = req.params.urlID as number;

    await this.appService.deleteShortenedURL(urlID, userID);

    return res
      .status(200)
      .json('URL이 성공적으로 삭제되었습니다. URL deleted.');
  }

  @Post()
  @UseGuards(JwtAuthGuard)
  async shortenURL(
    @Req() req,
    @Res() res: Response,
    @Body() body: shortenRequestDto,
  ) {
    const userID = req.user.userId;
    const originalURL = body.url;
    const expire = body.expiryDate;
    const password = body.password;
    const customURL = body.customURL;

    let expireDate: Date = null;
    if (expire !== null) {
      expireDate = new Date(expire);
    }

    const shortenedURL = await this.appService.shortenURL(
      originalURL,
      userID,
      expireDate,
      password,
      customURL,
    );

    return res.status(200).json(shortenedURL);
  }
}

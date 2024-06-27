import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { User } from './auth/entities/user.entity';
import { Repository } from 'typeorm';
import { Shorten } from './entities/shorten.entity';
import { InjectRedis } from '@liaoliaots/nestjs-redis';
import { Redis } from 'ioredis';
import { Click } from './entities/click.entity';
import { PasswordRequiredException } from './exception/PasswordRequired.exception';
import { AuthService } from './auth/auth.service';
import { AlreadyUrlExistException } from './exception/AlreadyUrlExist.exception';

@Injectable()
export class AppService {
  constructor(
    @InjectRepository(User)
    private userRepository: Repository<User>,
    @InjectRepository(Shorten)
    private shortenRepository: Repository<Shorten>,
    @InjectRepository(Click)
    private clickRepository: Repository<Click>,
    @InjectRedis('Redis')
    private redis: Redis,
    private readonly authService: AuthService,
  ) {}

  async shortenURL(
    originalURL: string,
    userID: number,
    expire: Date | null,
    password: string | null,
    customURL: string | null,
  ): Promise<Shorten | null> {
    let uniqueShortenedURL = false;
    let shortenedURLString = '';
    const shortenedURL = new Shorten();

    // If there is customurl, replace all slashes with empty string
    if (customURL) {
      // Remove All whitespaces
      customURL = customURL.replace(/\s/g, '');

      // Replace all forward slashes
      customURL = customURL.replace(/\//g, '');

      // Remove any forbidden characters (e.g., #, ?, &, etc.)
      customURL = customURL.replace(/[#?&]/g, '');

      // If the custom URL is empty, set it to null
      if (customURL === '') {
        customURL = null;
      }

      if (customURL && customURL.length > 100) {
        customURL = customURL.substring(0, 100);
      }
    }

    shortenedURL.originalURL = originalURL;
    shortenedURL.userID = userID;
    shortenedURL.expiredAt = expire;
    shortenedURL.deleted = false;
    shortenedURL.password =
      password !== null ? this.authService.hashPassword(password) : null;

    if (customURL) {
      const existingURL = await this.shortenRepository.findOne({
        where: { shortenedURL: customURL },
      });
      if (existingURL) {
        throw new AlreadyUrlExistException();
      }

      shortenedURL.shortenedURL = customURL;

      return this.shortenRepository.save(shortenedURL);
    }

    while (!uniqueShortenedURL) {
      shortenedURLString = Math.random().toString(36).substring(2, 8);
      const existingURL = await this.shortenRepository.findOne({
        where: { shortenedURL: shortenedURLString },
      });
      if (!existingURL) {
        uniqueShortenedURL = true;
      }
    }

    shortenedURL.shortenedURL = shortenedURLString;

    return this.shortenRepository.save(shortenedURL);
  }

  addClick(shortenedURLData: Shorten) {
    const click = new Click();
    click.shorten = shortenedURLData;
    click.clickDate = new Date();
    this.clickRepository.save(click);
  }

  async getPasswordProtectedUrl(shortenedURL: string, password: string) {
    const hashedPassword = this.authService.hashPassword(password);

    const shortenedURLData = await this.shortenRepository
      .createQueryBuilder('shorten')
      .where('shorten.shortenedURL = :shortenedURL', {
        shortenedURL: shortenedURL,
      })
      .getOne();

    if (!shortenedURLData) {
      throw new NotFoundException('URL has expired');
    }

    if (
      shortenedURLData.expiredAt < new Date() &&
      shortenedURLData.expiredAt !== null
    ) {
      this.shortenRepository
        .createQueryBuilder()
        .update(Shorten)
        .set({ deleted: true })
        .where('id = :id', { id: shortenedURLData.id })
        .execute();

      throw new NotFoundException('URL has expired');
    }

    if (shortenedURLData.password !== hashedPassword) {
      throw new PasswordRequiredException();
    }

    this.addClick(shortenedURLData);

    return shortenedURLData.originalURL;
  }

  async getOriginalURL(shortenedURL: string): Promise<string> {
    const redisOriginal = await this.redis.get(shortenedURL);

    if (redisOriginal === null) {
      const shortenedURLData = await this.shortenRepository.findOne({
        where: { shortenedURL: shortenedURL, deleted: false },
      });

      if (!shortenedURLData) {
        throw new NotFoundException('URL has expired');
      }

      if (
        shortenedURLData?.expiredAt < new Date() &&
        shortenedURLData.expiredAt !== null
      ) {
        this.shortenRepository
          .createQueryBuilder()
          .update(Shorten)
          .set({ deleted: true })
          .where('id = :id', { id: shortenedURLData.id })
          .execute();

        throw new NotFoundException('URL has expired');
      }

      if (shortenedURLData.password !== null) {
        throw new PasswordRequiredException();
      }

      if (shortenedURLData.expiredAt === null) {
        this.redis.set(
          shortenedURL,
          JSON.stringify({
            originalURL: shortenedURLData.originalURL,
            shortenID: shortenedURLData.id,
          }),
        );
      } else {
        this.redis.set(
          shortenedURL,
          JSON.stringify({
            originalURL: shortenedURLData.originalURL,
            shortenID: shortenedURLData.id,
          }),
          'EX',
          Math.floor(
            (shortenedURLData.expiredAt.getTime() - new Date().getTime()) /
              1000,
          ),
        );
      }

      this.addClick(shortenedURLData);

      return shortenedURLData.originalURL;
    }

    const redisData = JSON.parse(redisOriginal);

    this.addClick(redisData.shortenID);

    return redisData.originalURL;
  }

  async getAllShortenedURLs(userID: number): Promise<Shorten[]> {
    const shortenedURLs = await this.shortenRepository
      .createQueryBuilder('shorten')
      .where('shorten.userID = :userID', { userID: userID })
      .leftJoinAndSelect('shorten.clicks', 'clicks')
      .getMany();

    // If the shortened URL is expired, delete it from the database
    shortenedURLs.forEach(async (shortenedURL) => {
      if (
        shortenedURL.expiredAt < new Date() &&
        shortenedURL.expiredAt !== null
      ) {
        await this.shortenRepository
          .createQueryBuilder()
          .update(Shorten)
          .set({ deleted: true })
          .where('id = :id', { id: shortenedURL.id })
          .execute();
      }
    });

    return shortenedURLs;
  }

  async deleteShortenedURL(urlID: number, userID: number) {
    // Find the target URL
    const targetUrl = await this.shortenRepository
      .createQueryBuilder('shorten')
      .where('shorten.id = :urlID', { urlID: urlID })
      .andWhere('shorten.userID = :userID', { userID: userID })
      .getOne();

    // If the target URL exists in Redis, delete it
    if (this.redis.get(targetUrl.shortenedURL)) {
      this.redis.del(targetUrl.shortenedURL);
    }

    // Delete the target URL from the database
    const removedShortenedURL = await this.shortenRepository
      .createQueryBuilder()
      .delete()
      .from(Shorten)
      .where('id = :id', { id: urlID })
      .andWhere('userID = :userID', { userID: userID })
      .execute();

    if (removedShortenedURL.affected === 0) {
      throw new NotFoundException('URL not found');
    }

    return removedShortenedURL;
  }
}

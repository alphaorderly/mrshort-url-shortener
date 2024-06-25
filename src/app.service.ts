import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { User } from './auth/entities/user.entity';
import { Repository } from 'typeorm';
import { Shorten } from './entities/shorten.entity';
import { InjectRedis } from '@liaoliaots/nestjs-redis';
import { Redis } from 'ioredis';
import { Click } from './entities/click.entity';

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
  ) {}

  async shortenURL(
    originalURL: string,
    userID: number,
    expire: Date,
  ): Promise<Shorten> {
    let uniqueShortenedURL = false;
    let shortenedURLString = '';
    const shortenedURL = new Shorten();

    shortenedURL.originalURL = originalURL;
    shortenedURL.userID = userID;
    shortenedURL.expiredAt = expire;
    shortenedURL.deleted = false;

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

  async getOriginalURL(shortenedURL: string): Promise<string> {
    const redisOriginal = await this.redis.get(shortenedURL);

    if (redisOriginal === null) {
      const shortenedURLData = await this.shortenRepository.findOne({
        where: { shortenedURL: shortenedURL, deleted: false },
      });

      if (!shortenedURLData) {
        return null;
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

        return null;
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

      const click = new Click();
      click.shorten = shortenedURLData;
      click.clickDate = new Date();
      this.clickRepository.save(click);

      return shortenedURLData.originalURL;
    }

    const redisData = JSON.parse(redisOriginal);

    const click = new Click();
    click.shorten = redisData.shortenID;
    click.clickDate = new Date();
    this.clickRepository.save(click);

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
    if (this.redis.exists(targetUrl.shortenedURL)) {
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

    return removedShortenedURL;
  }
}

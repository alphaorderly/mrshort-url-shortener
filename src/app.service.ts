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

  async shortenURL(originalURL: string, userID: number): Promise<Shorten> {
    let uniqueShortenedURL = false;
    let shortenedURLString = '';
    const shortenedURL = new Shorten();

    shortenedURL.originalURL = originalURL;
    shortenedURL.userID = userID;

    const existingShortend = await this.shortenRepository
      .createQueryBuilder('shorten')
      .where('shorten.originalURL = :originalURL', { originalURL: originalURL })
      .andWhere('shorten.userID = :userID', { userID: userID })
      .getOne();

    if (existingShortend) {
      return existingShortend;
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

  async getOriginalURL(shortenedURL: string): Promise<string> {
    const redisOriginal = await this.redis.get(shortenedURL);

    if (redisOriginal === null) {
      const shortenedURLData = await this.shortenRepository.findOne({
        where: { shortenedURL: shortenedURL },
      });

      if (!shortenedURLData) {
        return null;
      }

      this.redis.set(
        shortenedURL,
        JSON.stringify({
          originalURL: shortenedURLData.originalURL,
          shortenID: shortenedURLData.id,
        }),
        'EX',
        60 * 60,
      );

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
    const removedShortenedURL = await this.shortenRepository.delete({
      id: urlID,
      userID: userID,
    });

    return removedShortenedURL;
  }
}

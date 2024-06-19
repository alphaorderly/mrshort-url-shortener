import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { User } from './auth/entities/user.entity';
import { Repository } from 'typeorm';
import { Shorten } from './entities/shorten.entity';

@Injectable()
export class AppService {
  constructor(
    @InjectRepository(User)
    private userRepository: Repository<User>,
    @InjectRepository(Shorten)
    private shortenRepository: Repository<Shorten>,
  ) {}

  async shortenURL(originalURL: string, userID: number): Promise<Shorten> {
    let uniqueShortenedURL = false;
    let shortenedURLString = '';
    const shortenedURL = new Shorten();
    shortenedURL.originalURL = originalURL;
    shortenedURL.userID = userID;

    const existingShortend = await this.shortenRepository.findOne({
      where: { originalURL: originalURL, userID: userID },
    });

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

  async getOriginalURL(shortenedURL: string): Promise<Shorten> {
    return this.shortenRepository.findOne({
      where: { shortenedURL: shortenedURL },
    });
  }

  async getAllShortenedURLs(userID: number): Promise<Shorten[]> {
    return this.shortenRepository.find({ where: { userID: userID } });
  }

  deleteShortenedURL(urlID: number, userID: number) {
    const removedShortenedURL = this.shortenRepository.delete({
      id: urlID,
      userID: userID,
    });

    return removedShortenedURL;
  }
}

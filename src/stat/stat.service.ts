import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Click } from 'src/entities/click.entity';
import { Shorten } from 'src/entities/shorten.entity';
import { Repository } from 'typeorm';

@Injectable()
export class StatService {
  constructor(
    @InjectRepository(Click)
    private clickRepository: Repository<Click>,
    @InjectRepository(Shorten)
    private shortenRepository: Repository<Shorten>,
  ) {}

  async getStat(
    userID: number,
    shortenURL: string,
  ): Promise<[Click[], Shorten]> {
    const shorten = await this.shortenRepository
      .createQueryBuilder('shorten')
      .where('shorten.userID = :userID', { userID })
      .andWhere('shorten.shortenedURL = :shortenURL', { shortenURL })
      .getOne();

    if (!shorten) {
      throw new NotFoundException();
    }

    const clicks = await this.clickRepository
      .createQueryBuilder('click')
      .where('click.shorten = :shorten', { shorten: shorten.id })
      .getMany();

    return [clicks, shorten];
  }
}

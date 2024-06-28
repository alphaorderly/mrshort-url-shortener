import { InjectRedis } from '@liaoliaots/nestjs-redis';
import { Injectable } from '@nestjs/common';
import { Redis } from 'ioredis';
import { AuthService } from 'src/auth/auth.service';
import { User } from 'src/auth/entities/user.entity';
import { v4 as uuidv4 } from 'uuid';
import { RegisterErrorDto } from './dtos/registerError.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

@Injectable()
export class RegisterService {
  constructor(
    @InjectRedis('Redis')
    private readonly redis: Redis,
    private readonly authService: AuthService,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
  ) {}

  createRegisterUrl(): string {
    const uuid = uuidv4();

    this.redis.set(uuid, uuid, 'EX', 60 * 60 * 24);
    // This redis key will expire in 24 hours

    return uuid;
  }

  verifyRegisterUrl(url: string): Promise<boolean> {
    return this.redis.get(url).then((result) => {
      return result === url;
    });
  }

  async registerUser(
    id: string,
    password: string,
    url: string,
  ): Promise<User | RegisterErrorDto> {
    const user = await this.userRepository
      .createQueryBuilder('user')
      .where('user.username = :id', { id })
      .getMany();

    if (user.length === 1) {
      return new RegisterErrorDto('이미 존재하는 아이디입니다.');
    }

    const newUser = await this.authService.register(id, password);

    await this.redis.del(url);

    return newUser;
  }
}

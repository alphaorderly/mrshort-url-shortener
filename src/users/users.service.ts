import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { PasswordService } from '../auth/password.service';
import { User } from './user.entity';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User) private readonly users: Repository<User>,
    private readonly passwords: PasswordService,
  ) {}

  count(): Promise<number> {
    return this.users.count();
  }

  /** 비밀번호 해시까지 포함해서 조회한다. 인증 처리에만 사용한다. */
  findWithHashByUsername(username: string): Promise<User | null> {
    return this.users
      .createQueryBuilder('user')
      .addSelect('user.passwordHash')
      .where('user.username = :username', { username })
      .getOne();
  }

  findWithHashById(id: number): Promise<User | null> {
    return this.users
      .createQueryBuilder('user')
      .addSelect('user.passwordHash')
      .where('user.id = :id', { id })
      .getOne();
  }

  async usernameExists(username: string): Promise<boolean> {
    return (await this.users.count({ where: { username } })) > 0;
  }

  async create(username: string, password: string): Promise<User> {
    const passwordHash = await this.passwords.hash(password);
    const saved = await this.users.save(
      this.users.create({ username, passwordHash }),
    );
    return { id: saved.id, username: saved.username } as User;
  }

  async updatePasswordHash(id: number, passwordHash: string): Promise<void> {
    await this.users.update(id, { passwordHash });
  }
}

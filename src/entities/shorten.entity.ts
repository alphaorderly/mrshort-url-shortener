import { User } from 'src/auth/entities/user.entity';
import {
  AfterLoad,
  Column,
  Entity,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { Click } from './click.entity';

@Entity()
export class Shorten {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => User, (user) => user.id)
  userID: number;

  @Column()
  originalURL: string;

  @Column({
    unique: true,
  })
  shortenedURL: string;

  @OneToMany(() => Click, (click) => click.shorten, {
    cascade: true,
    eager: true,
  })
  clicks: Click[];

  clickCount: number;

  @AfterLoad()
  countClicks() {
    this.clickCount = this.clicks?.length || 0;
  }
}

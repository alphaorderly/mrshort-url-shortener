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

  @ManyToOne(() => User, (user) => user.id, {
    onDelete: 'CASCADE',
  })
  userID: number;

  @Column({
    default: false,
  })
  deleted: boolean;

  @Column()
  originalURL: string;

  @Column({
    unique: true,
  })
  shortenedURL: string;

  // Expiration date, set default that old shorten will not be deleted
  @Column({
    type: 'timestamp',
    nullable: true,
    default: null,
  })
  expiredAt: Date | null;

  @OneToMany(() => Click, (click) => click.shorten, { eager: true })
  clicks: Click[];

  clickCount: number;

  @AfterLoad()
  countClicks() {
    this.clickCount = this.clicks?.length || 0;
  }
}

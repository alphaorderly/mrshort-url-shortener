import {
  Column,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { User } from '../users/user.entity';
import { Click } from './click.entity';

/** 테이블/컬럼 이름은 마이그레이션이 만든 이름(shorten, originalURL, ...)이고, 코드에서는 읽기 쉬운 이름을 쓴다. */
@Entity('shorten')
@Index('IDX_shorten_user', ['userId'])
export class Link {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ name: 'userIDId', type: 'integer', nullable: true })
  userId!: number | null;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'userIDId' })
  user?: User;

  @Column({ name: 'originalURL', type: 'varchar' })
  originalUrl!: string;

  @Column({ name: 'shortenedURL', type: 'varchar', unique: true })
  code!: string;

  @Column({ name: 'expiredAt', type: 'timestamp', nullable: true })
  expiresAt!: Date | null;

  @Column({ name: 'password', type: 'varchar', nullable: true })
  passwordHash!: string | null;

  @Column({
    name: 'createdAt',
    type: 'timestamp',
    default: () => 'now()',
    update: false,
  })
  createdAt!: Date;

  @OneToMany(() => Click, (click) => click.link)
  clicks?: Click[];

  /** loadRelationCountAndMap 으로 채워지는 값 */
  clickCount?: number;
}

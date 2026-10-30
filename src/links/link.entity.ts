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

/**
 * 기존 DB 와 호환되도록 테이블/컬럼 이름은 예전 이름(shorten, originalURL, ...)을 그대로 쓰고
 * 코드에서만 읽기 쉬운 이름을 사용한다.
 */
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

  /** 예전에 만든 링크는 생성 시각을 알 수 없어 null 이다. */
  @Column({
    name: 'createdAt',
    type: 'timestamp',
    nullable: true,
    default: () => 'now()',
    update: false,
  })
  createdAt!: Date | null;

  @OneToMany(() => Click, (click) => click.link)
  clicks?: Click[];

  /** loadRelationCountAndMap 으로 채워지는 값 */
  clickCount?: number;
}

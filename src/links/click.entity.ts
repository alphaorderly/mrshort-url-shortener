import {
  Column,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { Link } from './link.entity';

@Entity('click')
@Index('IDX_click_shorten_date', ['linkId', 'clickDate'])
export class Click {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ name: 'shortenId', type: 'integer', nullable: true })
  linkId!: number | null;

  @ManyToOne(() => Link, (link) => link.clicks, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'shortenId' })
  link?: Link;

  @Column({ type: 'timestamp' })
  clickDate!: Date;
}

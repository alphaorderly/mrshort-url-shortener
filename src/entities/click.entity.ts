import { Column, Entity, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';
import { Shorten } from './shorten.entity';

@Entity()
export class Click {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => Shorten, (shorten) => shorten.id, {
    onDelete: 'CASCADE',
  })
  shorten: Shorten;

  @Column()
  clickDate: Date;
}

import { Shorten } from 'src/entities/shorten.entity';
import { Column, Entity, OneToMany, PrimaryGeneratedColumn } from 'typeorm';

@Entity()
export class User {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({
    unique: true,
    length: 100,
  })
  username: string;

  @Column()
  password: string;

  @OneToMany(() => Shorten, (shorten) => shorten.userID)
  shortens: Shorten[];
}

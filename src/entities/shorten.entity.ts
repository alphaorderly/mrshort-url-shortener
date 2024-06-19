import { User } from 'src/auth/entities/user.entity';
import { Column, Entity, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';

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
}

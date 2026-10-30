import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';

@Entity('user')
export class User {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ type: 'varchar', length: 100, unique: true })
  username!: string;

  @Column({ name: 'password', type: 'varchar', select: false })
  passwordHash!: string;
}

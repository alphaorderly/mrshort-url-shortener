import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PasswordService } from '../auth/password.service';
import { AdminSeeder } from './admin.seeder';
import { User } from './user.entity';
import { UsersService } from './users.service';

@Module({
  imports: [TypeOrmModule.forFeature([User])],
  providers: [UsersService, PasswordService, AdminSeeder],
  exports: [UsersService, PasswordService],
})
export class UsersModule {}

import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { UsersModule } from '../users/users.module';
import { InvitesController } from './invites.controller';
import { InvitesService } from './invites.service';
import { RegisterController } from './register.controller';

@Module({
  imports: [UsersModule, AuthModule],
  controllers: [InvitesController, RegisterController],
  providers: [InvitesService],
})
export class InvitesModule {}

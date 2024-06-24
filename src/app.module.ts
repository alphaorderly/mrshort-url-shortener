import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthModule } from './auth/auth.module';
import { ConfigModule } from '@nestjs/config';
import { Shorten } from './entities/shorten.entity';
import { User } from './auth/entities/user.entity';
import { postgresConfig } from './postgresConfig';
import { RedisModule } from '@liaoliaots/nestjs-redis';
import { redisConfig } from './redisConfig';
import { Click } from './entities/click.entity';
import { StatModule } from './stat/stat.module';
import { RegisterModule } from './register/register.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),
    TypeOrmModule.forRoot(postgresConfig),
    RedisModule.forRoot(redisConfig),
    AuthModule,
    TypeOrmModule.forFeature([User, Shorten, Click]),
    StatModule,
    RegisterModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}

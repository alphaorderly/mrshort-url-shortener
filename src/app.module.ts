import { Module } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthModule } from './auth/auth.module';
import { SessionGuard } from './auth/session.guard';
import { APP_CONFIG, AppConfig } from './config/app.config';
import { AppConfigModule } from './config/config.module';
import { buildDataSourceOptions } from './database/typeorm.config';
import { InvitesModule } from './invites/invites.module';
import { LinksModule } from './links/links.module';
import { MetaModule } from './meta/meta.module';
import { RedisModule } from './redis/redis.module';
import { UsersModule } from './users/users.module';

@Module({
  imports: [
    AppConfigModule,
    RedisModule,
    TypeOrmModule.forRootAsync({
      inject: [APP_CONFIG],
      useFactory: (config: AppConfig) => ({
        ...buildDataSourceOptions(config.db),
        migrationsRun: true,
      }),
    }),
    ThrottlerModule.forRoot({
      throttlers: [{ ttl: 60_000, limit: 300 }],
      skipIf: () => process.env.THROTTLE_DISABLED === 'true',
    }),
    UsersModule,
    AuthModule,
    InvitesModule,
    MetaModule,
    // `/:code` 라우트를 가진 모듈은 마지막에 둔다.
    LinksModule,
  ],
  providers: [
    { provide: APP_GUARD, useClass: ThrottlerGuard },
    { provide: APP_GUARD, useClass: SessionGuard },
  ],
})
export class AppModule {}

import { Global, Module } from '@nestjs/common';
import { ConfigModule as NestConfigModule } from '@nestjs/config';
import { APP_CONFIG, loadConfig } from './app.config';

@Global()
@Module({
  imports: [NestConfigModule.forRoot({ envFilePath: '.env' })],
  providers: [{ provide: APP_CONFIG, useFactory: () => loadConfig() }],
  exports: [APP_CONFIG],
})
export class AppConfigModule {}

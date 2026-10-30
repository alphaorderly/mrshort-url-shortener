import {
  Inject,
  Injectable,
  Logger,
  OnApplicationBootstrap,
} from '@nestjs/common';
import { APP_CONFIG, AppConfig } from '../config/app.config';
import { UsersService } from './users.service';

/** 사용자가 한 명도 없을 때만 환경변수의 관리자 계정을 만든다. */
@Injectable()
export class AdminSeeder implements OnApplicationBootstrap {
  private readonly logger = new Logger(AdminSeeder.name);

  constructor(
    @Inject(APP_CONFIG) private readonly config: AppConfig,
    private readonly users: UsersService,
  ) {}

  async onApplicationBootstrap(): Promise<void> {
    if ((await this.users.count()) > 0) return;

    if (!this.config.admin) {
      this.logger.warn(
        '등록된 사용자가 없고 ADMIN_ID / ADMIN_PASSWORD 도 설정되지 않아 로그인할 수 없습니다.',
      );
      return;
    }

    await this.users.create(
      this.config.admin.username,
      this.config.admin.password,
    );
    this.logger.log(
      `관리자 계정 "${this.config.admin.username}" 을 만들었습니다.`,
    );
  }
}

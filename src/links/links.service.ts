import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Inject,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Redis } from 'ioredis';
import { Repository } from 'typeorm';
import { PasswordService } from '../auth/password.service';
import { isUniqueViolation } from '../common/db-errors';
import { REDIS } from '../redis/redis.module';
import { Click } from './click.entity';
import { CODE_PATTERN, generateCode, normalizeCode } from './code.util';
import { CreateLinkDto } from './links.dto';
import { Link } from './link.entity';

const CACHE_MAX_SECONDS = 60 * 60;
const MAX_CODE_ATTEMPTS = 6;
const STATS_DAYS = 30;
const RECENT_CLICKS = 20;
const NOT_FOUND_MESSAGE = '링크를 찾을 수 없거나 만료되었습니다.';

/** 없는 주소를 잠깐 기억해 두어, 같은 잘못된 주소가 반복돼도 DB 를 매번 조회하지 않는다. */
const MISS_SECONDS = 60;

const cacheKey = (code: string) => `link:${code}`;
const missKey = (code: string) => `miss:${code}`;

export type Resolution =
  { type: 'redirect'; url: string } | { type: 'password' };

export interface LinkView {
  id: number;
  code: string;
  originalUrl: string;
  hasPassword: boolean;
  expiresAt: string | null;
  expired: boolean;
  createdAt: string;
  clickCount: number;
}

export interface LinkStats {
  link: LinkView;
  total: number;
  last7: number;
  last30: number;
  daily: { date: string; count: number }[];
  recent: string[];
}

const pad = (value: number) => String(value).padStart(2, '0');
const dateKey = (date: Date) =>
  `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;

@Injectable()
export class LinksService {
  private readonly logger = new Logger(LinksService.name);

  constructor(
    @InjectRepository(Link) private readonly links: Repository<Link>,
    @InjectRepository(Click) private readonly clicks: Repository<Click>,
    @Inject(REDIS) private readonly redis: Redis,
    private readonly passwords: PasswordService,
  ) {}

  async list(userId: number): Promise<LinkView[]> {
    const rows = await this.links
      .createQueryBuilder('link')
      .where('link.userId = :userId', { userId })
      .loadRelationCountAndMap('link.clickCount', 'link.clicks')
      .orderBy('link.id', 'DESC')
      .getMany();
    return rows.map((link) => this.toView(link));
  }

  async create(userId: number, dto: CreateLinkDto): Promise<LinkView> {
    const expiresAt = dto.expiresAt ? new Date(dto.expiresAt) : null;
    if (expiresAt && expiresAt.getTime() <= Date.now()) {
      throw new BadRequestException('만료 시각은 현재보다 이후여야 합니다.');
    }

    const customCode = dto.code ? normalizeCode(dto.code) : null;
    if (customCode && !CODE_PATTERN.test(customCode)) {
      throw new BadRequestException(
        '주소는 글자, 숫자, _ - 만 사용해 100자 이하로 입력하세요.',
      );
    }

    const passwordHash = dto.password
      ? await this.passwords.hash(dto.password)
      : null;

    const draft = {
      userId,
      originalUrl: new URL(dto.url).toString(),
      expiresAt,
      passwordHash,
    };

    if (customCode) {
      try {
        const saved = await this.links.save(
          this.links.create({ ...draft, code: customCode }),
        );
        await this.forgetMiss(saved.code);
        return this.toView(saved);
      } catch (error) {
        if (isUniqueViolation(error)) {
          throw new ConflictException('이미 사용 중인 주소입니다.');
        }
        throw error;
      }
    }

    for (let attempt = 0; attempt < MAX_CODE_ATTEMPTS; attempt += 1) {
      const code = generateCode();
      try {
        const saved = await this.links.save(
          this.links.create({ ...draft, code }),
        );
        await this.forgetMiss(saved.code);
        return this.toView(saved);
      } catch (error) {
        if (!isUniqueViolation(error)) throw error;
      }
    }
    throw new ConflictException(
      '주소를 만들지 못했습니다. 잠시 후 다시 시도하세요.',
    );
  }

  async remove(userId: number, code: string): Promise<void> {
    const normalized = normalizeCode(code);
    const result = await this.links.delete({ code: normalized, userId });
    if (!result.affected) throw new NotFoundException(NOT_FOUND_MESSAGE);
    await this.cacheDelete(normalized);
  }

  async stats(userId: number, code: string): Promise<LinkStats> {
    const link = await this.links
      .createQueryBuilder('link')
      .where('link.code = :code', { code: normalizeCode(code) })
      .andWhere('link.userId = :userId', { userId })
      .loadRelationCountAndMap('link.clickCount', 'link.clicks')
      .getOne();
    if (!link) throw new NotFoundException(NOT_FOUND_MESSAGE);

    const today = new Date();
    const since = new Date(
      today.getFullYear(),
      today.getMonth(),
      today.getDate() - (STATS_DAYS - 1),
    );

    const rows = await this.clicks
      .createQueryBuilder('click')
      .select(`to_char(click."clickDate", 'YYYY-MM-DD')`, 'day')
      .addSelect('COUNT(*)::int', 'count')
      .where('click.linkId = :id', { id: link.id })
      .andWhere('click.clickDate >= :since', { since })
      .groupBy('day')
      .orderBy('day', 'ASC')
      .getRawMany<{ day: string; count: number }>();

    const perDay = new Map(rows.map((row) => [row.day, Number(row.count)]));
    const daily = Array.from({ length: STATS_DAYS }, (_, index) => {
      const date = dateKey(
        new Date(
          since.getFullYear(),
          since.getMonth(),
          since.getDate() + index,
        ),
      );
      return { date, count: perDay.get(date) ?? 0 };
    });

    const recent = await this.clicks.find({
      where: { linkId: link.id },
      order: { clickDate: 'DESC' },
      take: RECENT_CLICKS,
    });

    return {
      link: this.toView(link),
      total: link.clickCount ?? 0,
      last7: daily.slice(-7).reduce((sum, day) => sum + day.count, 0),
      last30: daily.reduce((sum, day) => sum + day.count, 0),
      daily,
      recent: recent.map((click) => click.clickDate.toISOString()),
    };
  }

  /** 짧은 주소를 원래 주소로 바꾼다. 비밀번호가 걸린 링크는 `password` 로 알려준다. */
  async resolve(
    code: string,
    options: { countClick: boolean },
  ): Promise<Resolution> {
    const normalized = normalizeCode(code);

    const cached = await this.cacheGet(normalized);
    if (cached) {
      if (options.countClick) this.recordClick(cached.id);
      return { type: 'redirect', url: cached.url };
    }

    if (await this.isKnownMiss(normalized)) {
      throw new NotFoundException(NOT_FOUND_MESSAGE);
    }

    const link = await this.links.findOne({ where: { code: normalized } });
    if (!link || this.isExpired(link)) {
      await this.rememberMiss(normalized);
      throw new NotFoundException(NOT_FOUND_MESSAGE);
    }
    if (link.passwordHash) return { type: 'password' };

    await this.cacheSet(link);
    if (options.countClick) this.recordClick(link.id);
    return { type: 'redirect', url: link.originalUrl };
  }

  async unlock(code: string, password: string): Promise<string> {
    const link = await this.links.findOne({
      where: { code: normalizeCode(code) },
    });
    if (!link || this.isExpired(link)) {
      throw new NotFoundException(NOT_FOUND_MESSAGE);
    }

    if (
      link.passwordHash &&
      !(await this.passwords.verify(password, link.passwordHash))
    ) {
      throw new ForbiddenException('비밀번호가 올바르지 않습니다.');
    }

    this.recordClick(link.id);
    return link.originalUrl;
  }

  private isExpired(link: Link): boolean {
    return link.expiresAt !== null && link.expiresAt.getTime() <= Date.now();
  }

  private toView(link: Link): LinkView {
    return {
      id: link.id,
      code: link.code,
      originalUrl: link.originalUrl,
      hasPassword: Boolean(link.passwordHash),
      expiresAt: link.expiresAt ? link.expiresAt.toISOString() : null,
      expired: this.isExpired(link),
      createdAt: link.createdAt.toISOString(),
      clickCount: link.clickCount ?? 0,
    };
  }

  /** 클릭 기록이 실패해도 리다이렉트는 막지 않는다. */
  private recordClick(linkId: number): void {
    this.clicks
      .insert({ linkId, clickDate: new Date() })
      .catch((error: Error) =>
        this.logger.error(`클릭 기록 실패(link ${linkId}): ${error.message}`),
      );
  }

  private async cacheGet(
    code: string,
  ): Promise<{ id: number; url: string } | null> {
    try {
      const raw = await this.redis.get(cacheKey(code));
      if (!raw) return null;
      const parsed = JSON.parse(raw) as { id?: unknown; url?: unknown };
      return typeof parsed.id === 'number' && typeof parsed.url === 'string'
        ? { id: parsed.id, url: parsed.url }
        : null;
    } catch (error) {
      this.logger.warn(`캐시 조회 실패: ${(error as Error).message}`);
      return null;
    }
  }

  private async cacheSet(link: Link): Promise<void> {
    const untilExpiry = link.expiresAt
      ? Math.floor((link.expiresAt.getTime() - Date.now()) / 1000)
      : CACHE_MAX_SECONDS;
    const ttl = Math.min(CACHE_MAX_SECONDS, untilExpiry);
    if (ttl <= 0) return;

    try {
      await this.redis.set(
        cacheKey(link.code),
        JSON.stringify({ id: link.id, url: link.originalUrl }),
        'EX',
        ttl,
      );
    } catch (error) {
      this.logger.warn(`캐시 저장 실패: ${(error as Error).message}`);
    }
  }

  private async isKnownMiss(code: string): Promise<boolean> {
    try {
      return (await this.redis.exists(missKey(code))) === 1;
    } catch (error) {
      this.logger.warn(`캐시 조회 실패: ${(error as Error).message}`);
      return false;
    }
  }

  private async rememberMiss(code: string): Promise<void> {
    try {
      await this.redis.set(missKey(code), '1', 'EX', MISS_SECONDS);
    } catch (error) {
      this.logger.warn(`캐시 저장 실패: ${(error as Error).message}`);
    }
  }

  /** 방금 만든 주소가 "없는 주소" 기록 때문에 열리지 않는 일이 없도록 지운다. */
  private async forgetMiss(code: string): Promise<void> {
    try {
      await this.redis.del(missKey(code));
    } catch (error) {
      this.logger.warn(`캐시 삭제 실패: ${(error as Error).message}`);
    }
  }

  private async cacheDelete(code: string): Promise<void> {
    try {
      await this.redis.del(cacheKey(code));
    } catch (error) {
      this.logger.warn(`캐시 삭제 실패: ${(error as Error).message}`);
    }
  }
}

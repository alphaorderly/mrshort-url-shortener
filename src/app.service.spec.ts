import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Redis } from 'ioredis';
import { Repository } from 'typeorm';
import { AppService } from './app.service';
import { User } from './auth/entities/user.entity';
import { Shorten } from './entities/shorten.entity';
import { getRedisToken } from '@liaoliaots/nestjs-redis';

const mockShortenRepository = () => ({
  findOne: jest.fn(),
  save: jest.fn(),
  find: jest.fn(),
  delete: jest.fn(),
});

const mockUserRepository = () => ({
  findOne: jest.fn(),
  save: jest.fn(),
  find: jest.fn(),
  delete: jest.fn(),
});

const mockedRedis = {
  get: jest.fn(),
  set: jest.fn(),
  exists: jest.fn(),
  del: jest.fn(),
};

describe('AppService', () => {
  let service: AppService;
  let shortenRepository;
  let redis;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AppService,
        {
          provide: getRepositoryToken(Shorten),
          useFactory: mockShortenRepository,
        },
        { provide: getRepositoryToken(User), useFactory: mockUserRepository },
        { provide: getRedisToken('Redis'), useValue: mockedRedis },
      ],
    }).compile();

    service = module.get<AppService>(AppService);
    shortenRepository = module.get<Repository<Shorten>>(
      getRepositoryToken(Shorten),
    );
    redis = module.get<Redis>(getRedisToken('Redis'));
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('shortenURL', () => {
    it('should return existing shortened URL if it exists', async () => {
      const mockShorten = {
        originalURL: 'http://example.com',
        userID: 1,
        shortenedURL: 'abc123',
      };
      shortenRepository.findOne.mockResolvedValue(mockShorten);

      const result = await service.shortenURL('http://example.com', 1);
      expect(result).toEqual(mockShorten);
      expect(shortenRepository.findOne).toHaveBeenCalledWith({
        where: { originalURL: 'http://example.com', userID: 1 },
      });
    });

    it('should create a new shortened URL if it does not exist', async () => {
      shortenRepository.findOne.mockResolvedValue(null);
      shortenRepository.save.mockResolvedValue({
        originalURL: 'http://example.com',
        userID: 1,
        shortenedURL: 'abc123',
      });

      const result = await service.shortenURL('http://example.com', 1);
      expect(result.shortenedURL).toHaveLength(6);
      expect(shortenRepository.save).toHaveBeenCalled();
    });
  });

  describe('getOriginalURL', () => {
    it('should return original URL from Redis if exists', async () => {
      redis.get.mockResolvedValue('http://example.com');

      const result = await service.getOriginalURL('abc123');
      expect(result).toEqual('http://example.com');
      expect(redis.get).toHaveBeenCalledWith('abc123');
    });

    it('should return original URL from database and set Redis if not in Redis', async () => {
      const mockShorten = {
        originalURL: 'http://example.com',
        shortenedURL: 'abc123',
      };
      redis.get.mockResolvedValue(null);
      shortenRepository.findOne.mockResolvedValue(mockShorten);

      const result = await service.getOriginalURL('abc123');
      expect(result).toEqual('http://example.com');
      expect(shortenRepository.findOne).toHaveBeenCalledWith({
        where: { shortenedURL: 'abc123' },
      });
      expect(redis.set).toHaveBeenCalledWith(
        'abc123',
        'http://example.com',
        'EX',
        60 * 60,
      );
    });
  });

  describe('getAllShortenedURLs', () => {
    it('should return all shortened URLs for a user', async () => {
      const mockShortens = [
        {
          originalURL: 'http://example.com',
          userID: 1,
          shortenedURL: 'abc123',
        },
      ];
      shortenRepository.find.mockResolvedValue(mockShortens);

      const result = await service.getAllShortenedURLs(1);
      expect(result).toEqual(mockShortens);
      expect(shortenRepository.find).toHaveBeenCalledWith({
        where: { userID: 1 },
      });
    });
  });

  describe('deleteShortenedURL', () => {
    it('should delete the shortened URL from database and Redis', async () => {
      const mockShorten = { id: 1, userID: 1, shortenedURL: 'abc123' };
      shortenRepository.findOne.mockResolvedValue(mockShorten);
      shortenRepository.delete.mockResolvedValue({ affected: 1 });
      redis.exists.mockResolvedValue(1);

      const result = await service.deleteShortenedURL(1, 1);
      expect(redis.del).toHaveBeenCalledWith('abc123');
      expect(shortenRepository.delete).toHaveBeenCalledWith({
        id: 1,
        userID: 1,
      });
      expect(result).toEqual({ affected: 1 });
    });
  });
});

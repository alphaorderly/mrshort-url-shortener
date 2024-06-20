import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { AppService } from './app.service';
import { Shorten } from './entities/shorten.entity';
import { User } from './auth/entities/user.entity';

describe('AppService', () => {
  let service: AppService;
  let shortenRepositoryMock: any;
  let userRepositoryMock: any;

  beforeEach(async () => {
    shortenRepositoryMock = {
      findOne: jest.fn(),
      save: jest.fn(),
      find: jest.fn(),
      delete: jest.fn(),
    };

    userRepositoryMock = {
      findOne: jest.fn(),
      save: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AppService,
        {
          provide: getRepositoryToken(Shorten),
          useValue: shortenRepositoryMock,
        },
        {
          provide: getRepositoryToken(User),
          useValue: userRepositoryMock,
        },
      ],
    }).compile();

    service = module.get<AppService>(AppService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('shortenURL', () => {
    it('should return an existing shortened URL if it already exists', async () => {
      const originalURL = 'https://example.com';
      const userID = 1;
      const existingShorten = new Shorten();
      existingShorten.originalURL = originalURL;
      existingShorten.userID = userID;

      shortenRepositoryMock.findOne.mockResolvedValue(existingShorten);

      const result = await service.shortenURL(originalURL, userID);

      expect(result).toEqual(existingShorten);
      expect(shortenRepositoryMock.findOne).toHaveBeenCalledWith({
        where: { originalURL, userID },
      });
    });

    it('should generate a unique shortened URL and save it', async () => {
      const originalURL = 'https://example.com';
      const userID = 1;
      const shortenedURLString = 'abc123';

      const shortenedURL = new Shorten();
      shortenedURL.originalURL = originalURL;
      shortenedURL.userID = userID;
      shortenedURL.shortenedURL = shortenedURLString;

      shortenRepositoryMock.findOne.mockResolvedValue(shortenedURL);

      const result = await service.shortenURL(originalURL, userID);

      expect(result).toEqual(shortenedURL);

      expect(shortenRepositoryMock.findOne).toHaveBeenNthCalledWith(1, {
        where: { originalURL, userID },
      });
    });
  });

  describe('getOriginalURL', () => {
    it('should return the original URL for a given shortened URL', async () => {
      const shortenedURL = 'abc123';
      const expectedShorten = new Shorten();
      expectedShorten.shortenedURL = shortenedURL;

      shortenRepositoryMock.findOne.mockResolvedValue(expectedShorten);

      const result = await service.getOriginalURL(shortenedURL);

      expect(result).toEqual(expectedShorten);
      expect(shortenRepositoryMock.findOne).toHaveBeenCalledWith({
        where: { shortenedURL },
      });
    });
  });

  describe('getAllShortenedURLs', () => {
    it('should return all shortened URLs for a given user ID', async () => {
      const userID = 1;
      const expectedShortens = [
        { shortenedURL: 'abc123' },
        { shortenedURL: 'def456' },
      ];

      shortenRepositoryMock.find.mockResolvedValue(expectedShortens);

      const result = await service.getAllShortenedURLs(userID);

      expect(result).toEqual(expectedShortens);
      expect(shortenRepositoryMock.find).toHaveBeenCalledWith({
        where: { userID },
      });
    });
  });

  describe('deleteShortenedURL', () => {
    it('should delete a shortened URL for a given URL ID and user ID', async () => {
      const urlID = 1;
      const userID = 1;
      const removedShortenedURL = {};

      shortenRepositoryMock.delete.mockResolvedValue(removedShortenedURL);

      const result = await service.deleteShortenedURL(urlID, userID);

      expect(result).toEqual(removedShortenedURL);
      expect(shortenRepositoryMock.delete).toHaveBeenCalledWith({
        id: urlID,
        userID,
      });
    });
  });
});

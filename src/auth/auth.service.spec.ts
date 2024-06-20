import { Test, TestingModule } from '@nestjs/testing';
import { AuthService } from './auth.service';
import { getRepositoryToken } from '@nestjs/typeorm';
import { JwtService } from '@nestjs/jwt';
import { User } from './entities/user.entity';
import { createHash } from 'crypto';

describe('AuthService', () => {
  let service: AuthService;
  let userRepositoryMock: any;
  let jwtServiceMock: any;

  beforeEach(async () => {
    userRepositoryMock = {
      findOne: jest.fn(),
      create: jest.fn(),
      save: jest.fn(),
      find: jest.fn(),
    };

    jwtServiceMock = {
      sign: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        {
          provide: getRepositoryToken(User),
          useValue: userRepositoryMock,
        },
        {
          provide: JwtService,
          useValue: jwtServiceMock,
        },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('hashPassword', () => {
    it('should hash the password using sha256', () => {
      const password = 'password';
      const hashedPassword = service.hashPassword(password);

      const checkHash = createHash('sha256')
        .update(password + process.env.HASH_SALT)
        .digest('hex');

      expect(hashedPassword).toBeDefined();
      expect(hashedPassword).toEqual(checkHash);
    });
  });

  describe('validateUser', () => {
    it('should return the user if found', async () => {
      const username = 'testuser';
      const password = 'password';
      const user = { username, password };

      userRepositoryMock.findOne.mockResolvedValue(user);

      const result = await service.validateUser(username, password);

      expect(result).toEqual(user);
      expect(userRepositoryMock.findOne).toHaveBeenCalledWith({
        where: { username, password },
      });
    });

    it('should return undefined if user is not found', async () => {
      const username = 'testuser';
      const password = 'password';

      userRepositoryMock.findOne.mockResolvedValue(undefined);

      const result = await service.validateUser(username, password);

      expect(result).toBeUndefined();
      expect(userRepositoryMock.findOne).toHaveBeenCalledWith({
        where: { username, password },
      });
    });
  });

  describe('register', () => {
    it('should create and save a new user', async () => {
      const username = 'testuser';
      const password = 'password';
      const hashedPassword = createHash('sha256')
        .update(password + process.env.HASH_SALT)
        .digest('hex');
      const user = { username, hashedPassword };

      userRepositoryMock.create.mockReturnValue(user);
      userRepositoryMock.save.mockResolvedValue(user);

      const result = await service.register(username, password);

      expect(result).toEqual(user);
      expect(userRepositoryMock.create).toHaveBeenCalledWith({
        username,
        password: hashedPassword,
      });
      expect(userRepositoryMock.save).toHaveBeenCalledWith(user);
    });
  });

  describe('findAll', () => {
    it('should return all users', async () => {
      const users = [{ username: 'user1' }, { username: 'user2' }];

      userRepositoryMock.find.mockResolvedValue(users);

      const result = await service.findAll();

      expect(result).toEqual(users);
      expect(userRepositoryMock.find).toHaveBeenCalled();
    });
  });

  describe('login', () => {
    it('should return an access token', async () => {
      const username = 'testuser';
      const password = createHash('sha256')
        .update('password' + process.env.HASH_SALT)
        .digest('hex');
      const user = new User();
      user.id = 1;
      user.username = username;
      user.password = password;

      userRepositoryMock.findOne.mockResolvedValue(user);
      jwtServiceMock.sign.mockReturnValue('token');

      const result = await service.login(user);

      expect(result).toEqual({ access_token: 'token' });
      expect(jwtServiceMock.sign).toHaveBeenCalled();
    });
  });
});

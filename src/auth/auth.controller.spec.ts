import { Test, TestingModule } from '@nestjs/testing';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { Response } from 'express';

describe('AuthController', () => {
  let controller: AuthController;
  let authServiceMock: any;
  let resMock: any;

  beforeEach(async () => {
    authServiceMock = {
      hashPassword: jest.fn(),
      validateUser: jest.fn(),
      login: jest.fn(),
    };

    resMock = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
      cookie: jest.fn(),
      redirect: jest.fn(),
      clearCookie: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [AuthController],
      providers: [
        {
          provide: AuthService,
          useValue: authServiceMock,
        },
      ],
    }).compile();

    controller = module.get<AuthController>(AuthController);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('login', () => {
    it('should return 401 if user is not found', async () => {
      const body = {
        username: 'testuser',
        password: 'password',
      };

      authServiceMock.hashPassword.mockReturnValue('hashedPassword');
      authServiceMock.validateUser.mockResolvedValue(undefined);

      await controller.login(body, resMock as Response);

      expect(authServiceMock.hashPassword).toHaveBeenCalledWith(body.password);
      expect(authServiceMock.validateUser).toHaveBeenCalledWith(
        body.username,
        'hashedPassword',
      );
      expect(resMock.status).toHaveBeenCalledWith(401);
      expect(resMock.json).toHaveBeenCalledWith({
        message: 'Invalid credentials',
      });
    });

    it('should set cookie and redirect if user is found', async () => {
      const body = {
        username: 'testuser',
        password: 'password',
      };
      const user = { username: 'testuser' };
      const token = { access_token: 'token' };

      authServiceMock.hashPassword.mockReturnValue('hashedPassword');
      authServiceMock.validateUser.mockResolvedValue(user);
      authServiceMock.login.mockResolvedValue(token);

      await controller.login(body, resMock as Response);

      expect(authServiceMock.hashPassword).toHaveBeenCalledWith(body.password);
      expect(authServiceMock.validateUser).toHaveBeenCalledWith(
        body.username,
        'hashedPassword',
      );
      expect(authServiceMock.login).toHaveBeenCalledWith(user);
      expect(resMock.cookie).toHaveBeenCalledWith('jwt', token.access_token, {
        httpOnly: true,
      });
      expect(resMock.redirect).toHaveBeenCalledWith('/');
    });
  });

  describe('logout', () => {
    it('should clear cookie and redirect', async () => {
      await controller.logout(resMock as Response);

      expect(resMock.clearCookie).toHaveBeenCalledWith('jwt');
      expect(resMock.redirect).toHaveBeenCalledWith('/');
    });
  });
});

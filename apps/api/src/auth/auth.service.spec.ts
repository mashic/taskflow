import { ForbiddenException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { Test, TestingModule } from '@nestjs/testing';
import * as bcrypt from 'bcrypt';
import { UsersService } from '../users/users.service';
import { AuthService, AuthUser } from './auth.service';

jest.mock('bcrypt');

describe('AuthService', () => {
  let authService: AuthService;
  let usersService: jest.Mocked<UsersService>;
  let jwtService: jest.Mocked<JwtService>;
  let configService: jest.Mocked<ConfigService>;

  const mockUser = {
    id: 'user-123',
    email: 'test@example.com',
    password: 'hashed-password',
    name: 'Test User',
    refreshToken: null,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const mockAuthUser: AuthUser = {
    id: 'user-123',
    email: 'test@example.com',
    name: 'Test User',
  };

  beforeEach(async () => {
    const mockUsersService = {
      create: jest.fn(),
      findByEmail: jest.fn(),
      findById: jest.fn(),
      updateRefreshToken: jest.fn(),
    };

    const mockJwtService = {
      signAsync: jest.fn(),
    };

    const mockConfigService = {
      get: jest.fn().mockImplementation((key: string) => {
        if (key === 'JWT_SECRET') return 'test-secret';
        if (key === 'JWT_REFRESH_SECRET') return 'test-refresh-secret';
        return undefined;
      }),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: UsersService, useValue: mockUsersService },
        { provide: JwtService, useValue: mockJwtService },
        { provide: ConfigService, useValue: mockConfigService },
      ],
    }).compile();

    authService = module.get<AuthService>(AuthService);
    usersService = module.get(UsersService) as jest.Mocked<UsersService>;
    jwtService = module.get(JwtService) as jest.Mocked<JwtService>;
    configService = module.get(ConfigService) as jest.Mocked<ConfigService>;
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('register', () => {
    it('should register a new user and return tokens', async () => {
      const email = 'newuser@example.com';
      const password = 'password123';
      const name = 'New User';

      usersService.create.mockResolvedValue({
        ...mockUser,
        email,
        name,
      });
      jwtService.signAsync
        .mockResolvedValueOnce('access-token')
        .mockResolvedValueOnce('refresh-token');
      (bcrypt.hash as jest.Mock).mockResolvedValue('hashed-refresh-token');
      usersService.updateRefreshToken.mockResolvedValue(undefined);

      const result = await authService.register(email, password, name);

      expect(result.accessToken).toBe('access-token');
      expect(result.refreshToken).toBe('refresh-token');
      expect(result.user.email).toBe(email);
      expect(usersService.create).toHaveBeenCalledWith(email, password, name);
    });
  });

  describe('validateUser', () => {
    it('should validate user with correct credentials', async () => {
      usersService.findByEmail.mockResolvedValue(mockUser);
      (bcrypt.compare as jest.Mock).mockResolvedValue(true);

      const result = await authService.validateUser('test@example.com', 'correct-password');

      expect(result).toEqual(mockAuthUser);
      expect(usersService.findByEmail).toHaveBeenCalledWith('test@example.com');
    });

    it('should reject invalid credentials (wrong password)', async () => {
      usersService.findByEmail.mockResolvedValue(mockUser);
      (bcrypt.compare as jest.Mock).mockResolvedValue(false);

      const result = await authService.validateUser('test@example.com', 'wrong-password');

      expect(result).toBeNull();
    });

    it('should reject invalid credentials (user not found)', async () => {
      usersService.findByEmail.mockResolvedValue(null);

      const result = await authService.validateUser('nonexistent@example.com', 'password');

      expect(result).toBeNull();
    });
  });

  describe('generateTokens', () => {
    it('should generate valid JWT tokens', async () => {
      jwtService.signAsync
        .mockResolvedValueOnce('access-token')
        .mockResolvedValueOnce('refresh-token');

      const result = await authService.generateTokens('user-123', 'test@example.com');

      expect(result.accessToken).toBe('access-token');
      expect(result.refreshToken).toBe('refresh-token');
      expect(jwtService.signAsync).toHaveBeenCalledTimes(2);
      expect(jwtService.signAsync).toHaveBeenNthCalledWith(
        1,
        { sub: 'user-123', email: 'test@example.com' },
        { secret: 'test-secret', expiresIn: '15m' },
      );
      expect(jwtService.signAsync).toHaveBeenNthCalledWith(
        2,
        { sub: 'user-123', email: 'test@example.com' },
        { secret: 'test-refresh-secret', expiresIn: '7d' },
      );
    });
  });

  describe('refreshTokens', () => {
    it('should refresh tokens correctly', async () => {
      const hashedRefreshToken = 'hashed-refresh-token';
      usersService.findById.mockResolvedValue({
        ...mockUser,
        refreshToken: hashedRefreshToken,
      });
      (bcrypt.compare as jest.Mock).mockResolvedValue(true);
      (bcrypt.hash as jest.Mock).mockResolvedValue('new-hashed-refresh-token');
      jwtService.signAsync
        .mockResolvedValueOnce('new-access-token')
        .mockResolvedValueOnce('new-refresh-token');
      usersService.updateRefreshToken.mockResolvedValue(undefined);

      const result = await authService.refreshTokens('user-123', 'old-refresh-token');

      expect(result.accessToken).toBe('new-access-token');
      expect(result.refreshToken).toBe('new-refresh-token');
      expect(usersService.updateRefreshToken).toHaveBeenCalled();
    });

    it('should reject refresh if user not found', async () => {
      usersService.findById.mockResolvedValue(null);

      await expect(authService.refreshTokens('user-123', 'token')).rejects.toThrow(ForbiddenException);
    });

    it('should reject refresh if token does not match', async () => {
      usersService.findById.mockResolvedValue({
        ...mockUser,
        refreshToken: 'stored-hash',
      });
      (bcrypt.compare as jest.Mock).mockResolvedValue(false);

      await expect(authService.refreshTokens('user-123', 'wrong-token')).rejects.toThrow(ForbiddenException);
    });
  });

  describe('logout', () => {
    it('should clear refresh token on logout', async () => {
      usersService.updateRefreshToken.mockResolvedValue(undefined);

      await authService.logout('user-123');

      expect(usersService.updateRefreshToken).toHaveBeenCalledWith('user-123', null);
    });
  });

  describe('login', () => {
    it('should generate tokens for validated user', async () => {
      jwtService.signAsync
        .mockResolvedValueOnce('access-token')
        .mockResolvedValueOnce('refresh-token');
      (bcrypt.hash as jest.Mock).mockResolvedValue('hashed-refresh-token');
      usersService.updateRefreshToken.mockResolvedValue(undefined);

      const result = await authService.login(mockAuthUser);

      expect(result.accessToken).toBe('access-token');
      expect(result.refreshToken).toBe('refresh-token');
      expect(result.user).toEqual(mockAuthUser);
    });
  });
});

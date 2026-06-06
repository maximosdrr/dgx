import { Test, TestingModule } from '@nestjs/testing';
import { ConflictException, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { AuthService } from './auth.service';
import * as bcrypt from 'bcrypt';

const mockUser = {
  id: 'uuid-1',
  email: 'test@docgen.com.br',
  name: 'Test',
  passwordHash: '',
};

const mockEm = {
  findOne: jest.fn(),
  findOneOrFail: jest.fn(),
  create: jest.fn(),
  flush: jest.fn(),
};

const mockJwtService = {
  sign: jest.fn().mockReturnValue('token'),
  verify: jest.fn(),
};

const mockConfig = {
  getOrThrow: jest.fn().mockReturnValue('secret'),
  get: jest.fn().mockReturnValue('15m'),
};

describe('AuthService', () => {
  let service: AuthService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: 'EntityManager', useValue: mockEm },
        { provide: JwtService, useValue: mockJwtService },
        { provide: ConfigService, useValue: mockConfig },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
    jest.clearAllMocks();
  });

  describe('register', () => {
    it('throws ConflictException if email exists', async () => {
      mockEm.findOne.mockResolvedValue(mockUser);
      await expect(
        service.register({ name: 'Test', email: 'test@docgen.com.br', password: 'Test@123' }),
      ).rejects.toThrow(ConflictException);
    });

    it('creates user and returns tokens', async () => {
      mockEm.findOne.mockResolvedValue(null);
      mockEm.create.mockReturnValue({ ...mockUser, passwordHash: 'hash' });
      mockEm.flush.mockResolvedValue(undefined);

      const result = await service.register({
        name: 'Test',
        email: 'test@docgen.com.br',
        password: 'Test@123',
      });

      expect(result).toHaveProperty('accessToken');
      expect(result).toHaveProperty('refreshToken');
    });
  });

  describe('login', () => {
    it('throws UnauthorizedException for unknown email', async () => {
      mockEm.findOne.mockResolvedValue(null);
      await expect(
        service.login({ email: 'nope@docgen.com.br', password: 'Test@123' }),
      ).rejects.toThrow(UnauthorizedException);
    });

    it('throws UnauthorizedException for wrong password', async () => {
      const hash = await bcrypt.hash('correct', 12);
      mockEm.findOne.mockResolvedValue({ ...mockUser, passwordHash: hash });
      await expect(
        service.login({ email: mockUser.email, password: 'wrong' }),
      ).rejects.toThrow(UnauthorizedException);
    });

    it('returns tokens on valid credentials', async () => {
      const hash = await bcrypt.hash('Test@123', 12);
      mockEm.findOne.mockResolvedValue({ ...mockUser, passwordHash: hash });
      const result = await service.login({ email: mockUser.email, password: 'Test@123' });
      expect(result).toHaveProperty('accessToken');
    });
  });
});

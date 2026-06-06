import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException, ForbiddenException } from '@nestjs/common';
import { TemplatesService } from './templates.service';
import { TemplateCategory } from '@docgen/shared';

const mockUser = { sub: 'user-1', email: 'test@test.com', name: 'Test' };

const mockTemplate = {
  id: 'tpl-1',
  user: { id: 'user-1' },
  name: 'Template 1',
  isActive: true,
  variables: [],
};

const mockEm = {
  find: jest.fn(),
  findOne: jest.fn(),
  getReference: jest.fn(),
  create: jest.fn(),
  assign: jest.fn(),
  flush: jest.fn(),
};

describe('TemplatesService', () => {
  let service: TemplatesService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TemplatesService,
        { provide: 'EntityManager', useValue: mockEm },
      ],
    }).compile();

    service = module.get<TemplatesService>(TemplatesService);
    jest.clearAllMocks();
  });

  describe('findAll', () => {
    it('returns templates for user', async () => {
      mockEm.find.mockResolvedValue([mockTemplate]);
      const result = await service.findAll(mockUser);
      expect(result).toHaveLength(1);
    });
  });

  describe('findOne', () => {
    it('throws NotFoundException if not found', async () => {
      mockEm.findOne.mockResolvedValue(null);
      await expect(service.findOne('tpl-x', mockUser)).rejects.toThrow(NotFoundException);
    });

    it('throws ForbiddenException if wrong user', async () => {
      mockEm.findOne.mockResolvedValue({ ...mockTemplate, user: { id: 'other-user' } });
      await expect(service.findOne('tpl-1', mockUser)).rejects.toThrow(ForbiddenException);
    });

    it('returns template for correct user', async () => {
      mockEm.findOne.mockResolvedValue(mockTemplate);
      const result = await service.findOne('tpl-1', mockUser);
      expect(result.id).toBe('tpl-1');
    });
  });

  describe('create', () => {
    it('creates and flushes template', async () => {
      mockEm.getReference.mockReturnValue({ id: 'user-1' });
      mockEm.create.mockReturnValue(mockTemplate);
      mockEm.flush.mockResolvedValue(undefined);

      const result = await service.create(
        { name: 'New', category: TemplateCategory.CONTRATO },
        mockUser,
      );
      expect(mockEm.flush).toHaveBeenCalled();
      expect(result.name).toBe('Template 1');
    });
  });
});

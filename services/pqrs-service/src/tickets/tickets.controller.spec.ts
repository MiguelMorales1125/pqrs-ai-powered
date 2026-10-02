import { Test, TestingModule } from '@nestjs/testing';
import { TicketsController } from './tickets.controller';
import { TicketsService } from './tickets.service';
import { PrismaService } from '../prisma/prisma.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { JwtService } from '@nestjs/jwt';

describe('TicketsController', () => {
  let controller: TicketsController;
  let service: TicketsService;

  const mockTicketsService = {
    create: jest.fn(),
    findAll: jest.fn(),
    findByUserId: jest.fn(),
    findOne: jest.fn(),
    findOneForUser: jest.fn(),
    updateStatus: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [TicketsController],
      providers: [
        {
          provide: TicketsService,
          useValue: mockTicketsService,
        },
        {
          provide: JwtAuthGuard,
          useValue: {},
        },
        {
          provide: JwtService,
          useValue: {},
        },
      ],
    }).compile();

    controller = module.get<TicketsController>(TicketsController);
    service = module.get<TicketsService>(TicketsService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('create', () => {
    it('should create a new ticket', async () => {
      const createDto = { subject: 'Test', description: 'Test desc' };
      const expectedResult = {
        id: 'uuid-1',
        userId: '123',
        ...createDto,
        status: 'PENDING',
        isUrgent: false,
      };
      
      mockTicketsService.create.mockResolvedValue(expectedResult);

      const result = await controller.create(
        { user: { sub: '123', email: 'user@example.com', role: 'USER' } } as never,
        createDto,
      );
      expect(result).toEqual(expectedResult);
      expect(mockTicketsService.create).toHaveBeenCalledWith('123', createDto);
    });
  });

  describe('findAll', () => {
    it('should return an array of tickets wrapped in data/meta', async () => {
      const tickets = [{ id: '1', subject: 'Test' }];
      mockTicketsService.findAll.mockResolvedValue(tickets);

      const result = await controller.findAll({
        user: { sub: 'admin-1', email: 'admin@example.com', role: 'ADMIN' },
      } as never);
      expect(result).toEqual({
        data: tickets,
        meta: { pagination: { total: 1 } },
      });
    });

    it('rejects a non-admin listing all tickets', async () => {
      await expect(
        controller.findAll({
          user: { sub: 'user-1', email: 'user@example.com', role: 'USER' },
        } as never),
      ).rejects.toThrow('Only administrators can list all tickets');
    });
  });
});

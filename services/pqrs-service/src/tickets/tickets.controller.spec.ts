import { Test, TestingModule } from '@nestjs/testing';
import { TicketsController } from './tickets.controller';
import { TicketsService } from './tickets.service';
import { PrismaService } from '../prisma/prisma.service';

describe('TicketsController', () => {
  let controller: TicketsController;
  let service: TicketsService;

  const mockTicketsService = {
    create: jest.fn(),
    findAll: jest.fn(),
    findByUserId: jest.fn(),
    findOne: jest.fn(),
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
      const createDto = { userId: '123', subject: 'Test', description: 'Test desc' };
      const expectedResult = { id: 'uuid-1', ...createDto, status: 'PENDING', isUrgent: false };
      
      mockTicketsService.create.mockResolvedValue(expectedResult);

      const result = await controller.create(createDto);
      expect(result).toEqual(expectedResult);
      expect(mockTicketsService.create).toHaveBeenCalledWith(createDto);
    });
  });

  describe('findAll', () => {
    it('should return an array of tickets wrapped in data/meta', async () => {
      const tickets = [{ id: '1', subject: 'Test' }];
      mockTicketsService.findAll.mockResolvedValue(tickets);

      const result = await controller.findAll();
      expect(result).toEqual({
        data: tickets,
        meta: { pagination: { total: 1 } },
      });
    });
  });
});

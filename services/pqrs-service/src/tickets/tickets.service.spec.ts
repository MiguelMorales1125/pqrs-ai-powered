import { Test, TestingModule } from '@nestjs/testing';
import { TicketsService } from './tickets.service';
import { Queue } from 'bullmq';
import { PrismaService } from '../prisma/prisma.service';
import { getQueueToken } from '@nestjs/bullmq';

describe('TicketsService', () => {
  let service: TicketsService;
  let prisma: PrismaService;

  const mockPrismaService = {
    ticket: {
      create: jest.fn(),
      findMany: jest.fn(),
      findUnique: jest.fn(),
      update: jest.fn(),
    },
  };

  const mockQueue = {
    add: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TicketsService,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
        {
          provide: Queue,
          useValue: mockQueue,
        },
      ],
    }).compile();

    service = module.get<TicketsService>(TicketsService);
    prisma = module.get<PrismaService>(PrismaService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    it('should create a ticket and add a job to the queue', async () => {
      const createDto = { userId: '123', subject: 'Test', description: 'Test desc' };
      const expectedTicket = { id: 'uuid-1', ...createDto, status: 'PENDING' };

      mockPrismaService.ticket.create.mockResolvedValue(expectedTicket);

      const result = await service.create(createDto);

      expect(mockPrismaService.ticket.create).toHaveBeenCalledWith({
        data: createDto,
      });
      expect(mockQueue.add).toHaveBeenCalledWith(
        'triage',
        { ticketId: expectedTicket.id },
        expect.any(Object),
      );
      expect(result).toEqual(expectedTicket);
    });
  });

  describe('findAll', () => {
    it('should return all tickets ordered', async () => {
      const expectedTickets = [{ id: '1', subject: 'Test' }];
      mockPrismaService.ticket.findMany.mockResolvedValue(expectedTickets);

      const result = await service.findAll();
      expect(result).toEqual(expectedTickets);
    });
  });

  describe('findOne', () => {
    it('should return a ticket if found', async () => {
      const ticket = { id: '1', subject: 'Test' };
      mockPrismaService.ticket.findUnique.mockResolvedValue(ticket);

      const result = await service.findOne('1');
      expect(result).toEqual(ticket);
    });

    it('should throw NotFoundException if not found', async () => {
      mockPrismaService.ticket.findUnique.mockResolvedValue(null);

      await expect(service.findOne('999')).rejects.toThrow('Ticket with ID 999 not found');
    });
  });
});

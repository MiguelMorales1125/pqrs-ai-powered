import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateTicketDto } from './dto/create-ticket.dto';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';

@Injectable()
export class TicketsService {
  constructor(
    private readonly prisma: PrismaService,
    @InjectQueue('tickets-triage') private readonly triageQueue: Queue,
  ) {}

  async create(userId: string, dto: CreateTicketDto) {
    const ticket = await this.prisma.ticket.create({
      data: {
        userId,
        subject: dto.subject,
        description: dto.description,
      },
    });

    await this.triageQueue.add(
      'triage',
      { ticketId: ticket.id },
      {
        attempts: 3,
        backoff: { type: 'exponential', delay: 5000 },
        removeOnComplete: true,
      },
    );

    return ticket;
  }

  async findAll() {
    return this.prisma.ticket.findMany({
      orderBy: [
        { isUrgent: 'desc' },
        { createdAt: 'desc' },
      ],
    });
  }

  async findOne(id: string) {
    const ticket = await this.prisma.ticket.findUnique({
      where: { id },
    });

    if (!ticket) {
      throw new NotFoundException(`Ticket with ID ${id} not found`);
    }

    return ticket;
  }

  async findOneForUser(id: string, requesterId: string, requesterRole: string) {
    const ticket = await this.findOne(id);
    if (ticket.userId !== requesterId && requesterRole !== 'ADMIN') {
      throw new ForbiddenException('You can only access your own tickets');
    }
    return ticket;
  }

  async findByUserId(
    userId: string,
    requesterId: string,
    requesterRole: string,
  ) {
    if (userId !== requesterId && requesterRole !== 'ADMIN') {
      throw new ForbiddenException('You can only access your own tickets');
    }
    return this.prisma.ticket.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    });
  }

  async updateStatus(
    id: string,
    status: string,
    requesterRole: string,
  ) {
    if (requesterRole !== 'ADMIN') {
      throw new ForbiddenException('Only administrators can update ticket status');
    }
    await this.findOne(id);
    return this.prisma.ticket.update({
      where: { id },
      data: { status },
    });
  }
}

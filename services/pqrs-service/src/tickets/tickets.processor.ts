import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Job } from 'bullmq';
import { Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AiTriageService } from '../ai/ai-triage.service';

@Processor('tickets-triage')
export class TicketsProcessor extends WorkerHost {
  private readonly logger = new Logger(TicketsProcessor.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly aiTriageService: AiTriageService,
  ) {
    super();
  }

  async process(job: Job<{ ticketId: string }, any, string>): Promise<any> {
    const { ticketId } = job.data;
    this.logger.log(`Processing AI Triage for ticket ${ticketId}`);

    const ticket = await this.prisma.ticket.findUnique({
      where: { id: ticketId },
    });

    if (!ticket) {
      this.logger.warn(`Ticket ${ticketId} not found. Skipping...`);
      return;
    }

    try {
      // Async AI Processing
      const analysis = await this.aiTriageService.analyzeTicket(
        ticket.subject, 
        ticket.description
      );

      // Update the DB
      await this.prisma.ticket.update({
        where: { id: ticketId },
        data: {
          category: analysis.category,
          department: analysis.department,
          priority: analysis.priority,
          isUrgent: analysis.isUrgent,
          summary: analysis.summary,
          priorityJustification: analysis.priorityJustification,
          status: 'AI_PROCESSED',
        },
      });

      this.logger.log(`Successfully triaged ticket ${ticketId}`);
    } catch (error) {
      this.logger.error(`Failed to triage ticket ${ticketId}`, error.stack);
      // Update DB to mark as failed
      await this.prisma.ticket.update({
        where: { id: ticketId },
        data: { status: 'TRIAGE_FAILED' },
      });
      throw error;
    }
  }
}

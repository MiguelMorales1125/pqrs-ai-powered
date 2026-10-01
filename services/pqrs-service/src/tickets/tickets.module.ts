import { Module } from '@nestjs/common';
import { TicketsController } from './tickets.controller';
import { TicketsService } from './tickets.service';
import { AiModule } from '../ai/ai.module';

import { BullModule } from '@nestjs/bullmq';
import { TicketsProcessor } from './tickets.processor';

@Module({
  imports: [
    AiModule,
    BullModule.registerQueue({
      name: 'tickets-triage',
    }),
  ],
  controllers: [TicketsController],
  providers: [TicketsService, TicketsProcessor],
  exports: [TicketsService],
})
export class TicketsModule {}

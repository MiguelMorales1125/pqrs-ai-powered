import { Body, Controller, Get, Param, Patch, Post } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { TicketsService } from './tickets.service';
import { CreateTicketDto } from './dto/create-ticket.dto';
import { TicketResponseDto } from './dto/ticket-response.dto';
import { UpdateTicketStatusDto } from './dto/update-ticket-status.dto';

@ApiTags('Tickets')
@Controller('tickets')
export class TicketsController {
  constructor(private readonly ticketsService: TicketsService) {}

  @Post()
  @ApiOperation({ summary: 'Submit a new PQRS ticket to the queue' })
  @ApiResponse({ status: 201, type: TicketResponseDto })
  create(@Body() dto: CreateTicketDto) {
    return this.ticketsService.create(dto);
  }

  @Get()
  @ApiOperation({ summary: 'List all PQRS tickets ordered by urgency and date' })
  async findAll() {
    const rows = await this.ticketsService.findAll();
    return {
      data: rows,
      meta: {
        pagination: {
          total: rows.length,
        },
      },
    };
  }

  @Get('user/:userId')
  @ApiOperation({ summary: 'List tickets for a specific user' })
  async findByUserId(@Param('userId') userId: string) {
    const rows = await this.ticketsService.findByUserId(userId);
    return {
      data: rows,
      meta: {
        pagination: { total: rows.length },
      },
    };
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get ticket details by ID' })
  @ApiResponse({ status: 200, type: TicketResponseDto })
  findOne(@Param('id') id: string) {
    return this.ticketsService.findOne(id);
  }

  @Patch(':id/status')
  @ApiOperation({ summary: 'Update the status of a ticket manually' })
  @ApiResponse({ status: 200, type: TicketResponseDto })
  updateStatus(
    @Param('id') id: string,
    @Body() dto: UpdateTicketStatusDto,
  ) {
    return this.ticketsService.updateStatus(id, dto.status);
  }
}

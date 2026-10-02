import {
  Body,
  Controller,
  ForbiddenException,
  Get,
  Param,
  Patch,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { TicketsService } from './tickets.service';
import { CreateTicketDto } from './dto/create-ticket.dto';
import { TicketResponseDto } from './dto/ticket-response.dto';
import { UpdateTicketStatusDto } from './dto/update-ticket-status.dto';
import {
  AuthenticatedRequest,
  JwtAuthGuard,
} from '../auth/jwt-auth.guard';

@ApiTags('Tickets')
@Controller('tickets')
@UseGuards(JwtAuthGuard)
export class TicketsController {
  constructor(private readonly ticketsService: TicketsService) {}

  @Post()
  @ApiOperation({ summary: 'Submit a new PQRS ticket to the queue' })
  @ApiResponse({ status: 201, type: TicketResponseDto })
  create(@Req() request: AuthenticatedRequest, @Body() dto: CreateTicketDto) {
    return this.ticketsService.create(request.user.sub, dto);
  }

  @Get()
  @ApiOperation({ summary: 'List all PQRS tickets ordered by urgency and date' })
  async findAll(@Req() request: AuthenticatedRequest) {
    if (request.user.role !== 'ADMIN') {
      throw new ForbiddenException('Only administrators can list all tickets');
    }
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
  async findByUserId(
    @Param('userId') userId: string,
    @Req() request: AuthenticatedRequest,
  ) {
    const rows = await this.ticketsService.findByUserId(
      userId,
      request.user.sub,
      request.user.role,
    );
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
  findOne(
    @Param('id') id: string,
    @Req() request: AuthenticatedRequest,
  ) {
    return this.ticketsService.findOneForUser(
      id,
      request.user.sub,
      request.user.role,
    );
  }

  @Patch(':id/status')
  @ApiOperation({ summary: 'Update the status of a ticket manually' })
  @ApiResponse({ status: 200, type: TicketResponseDto })
  updateStatus(
    @Param('id') id: string,
    @Body() dto: UpdateTicketStatusDto,
    @Req() request: AuthenticatedRequest,
  ) {
    return this.ticketsService.updateStatus(id, dto.status, request.user.role);
  }
}

import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class TicketResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  userId: string;

  @ApiProperty()
  subject: string;

  @ApiProperty()
  description: string;

  @ApiPropertyOptional()
  category?: string;

  @ApiPropertyOptional()
  department?: string;

  @ApiPropertyOptional()
  priority?: string;

  @ApiProperty()
  isUrgent: boolean;

  @ApiPropertyOptional()
  summary?: string;

  @ApiPropertyOptional()
  priorityJustification?: string;

  @ApiProperty()
  status: string;

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  updatedAt: Date;
}

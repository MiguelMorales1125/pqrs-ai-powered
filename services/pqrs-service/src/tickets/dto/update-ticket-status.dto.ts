import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';

export class UpdateTicketStatusDto {
  @ApiProperty({ example: 'RESOLVED' })
  @IsString()
  @IsNotEmpty()
  status: string;
}

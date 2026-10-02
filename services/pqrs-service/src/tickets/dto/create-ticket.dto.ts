import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, MaxLength, MinLength } from 'class-validator';

export class CreateTicketDto {
  @ApiProperty({ example: 'Prolonged fiber outage in Sector 4' })
  @IsString()
  @IsNotEmpty()
  @MinLength(5)
  @MaxLength(200)
  subject: string;

  @ApiProperty({ example: 'The internet service has been down for 4 days. Critical for remote work.' })
  @IsString()
  @IsNotEmpty()
  @MinLength(10)
  description: string;
}

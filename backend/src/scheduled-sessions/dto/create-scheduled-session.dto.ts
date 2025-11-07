import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsInt, IsPositive, IsDateString, IsOptional, IsString } from 'class-validator';

export class CreateScheduledSessionDto {
  @ApiProperty({
    description: 'Data e hora agendada (ISO 8601)',
    example: '2024-11-07T14:00:00Z',
  })
  @IsNotEmpty()
  @IsDateString()
  scheduledAt: string;

  @ApiProperty({
    description: 'Duração da sessão em minutos',
    example: 25,
  })
  @IsInt()
  @IsPositive()
  duration: number;

  @ApiProperty({
    description: 'ID do assunto (Topic)',
    example: 1,
  })
  @IsNotEmpty()
  @IsInt()
  topicId: number;

  @ApiProperty({
    description: 'Notas opcionais sobre a sessão',
    required: false,
  })
  @IsOptional()
  @IsString()
  notes?: string;
}


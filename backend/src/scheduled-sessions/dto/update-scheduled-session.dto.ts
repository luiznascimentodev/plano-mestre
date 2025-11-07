import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsInt, IsPositive, IsDateString, IsString } from 'class-validator';

export class UpdateScheduledSessionDto {
  @ApiProperty({
    description: 'Data e hora agendada (ISO 8601)',
    required: false,
  })
  @IsOptional()
  @IsDateString()
  scheduledAt?: string;

  @ApiProperty({
    description: 'Duração da sessão em minutos',
    required: false,
  })
  @IsOptional()
  @IsInt()
  @IsPositive()
  duration?: number;

  @ApiProperty({
    description: 'ID do assunto (Topic)',
    required: false,
  })
  @IsOptional()
  @IsInt()
  topicId?: number;

  @ApiProperty({
    description: 'Notas opcionais sobre a sessão',
    required: false,
  })
  @IsOptional()
  @IsString()
  notes?: string;
}


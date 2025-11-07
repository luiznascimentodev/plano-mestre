import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsInt, IsString, IsDateString } from 'class-validator';

export class CompleteHabitDto {
  @ApiProperty({
    description: 'Valor completado (ex: minutos estudados, sessões feitas)',
    required: false,
    example: 25,
  })
  @IsOptional()
  @IsInt()
  value?: number;

  @ApiProperty({
    description: 'Notas sobre a conclusão',
    required: false,
  })
  @IsOptional()
  @IsString()
  notes?: string;

  @ApiProperty({
    description: 'Data de conclusão (padrão: hoje)',
    required: false,
  })
  @IsOptional()
  @IsDateString()
  completedAt?: string;
}


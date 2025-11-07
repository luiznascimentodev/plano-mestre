import { ApiProperty } from '@nestjs/swagger';
import {
  IsNotEmpty,
  IsString,
  IsOptional,
  IsEnum,
  IsInt,
  IsBoolean,
  IsDateString,
  MaxLength,
} from 'class-validator';
import { HabitType, HabitFrequency } from '@prisma/client';

export class CreateHabitDto {
  @ApiProperty({
    description: 'Nome do hábito',
    example: 'Estudar 25 minutos por dia',
  })
  @IsString()
  @IsNotEmpty({ message: 'O nome não pode estar vazio.' })
  @MaxLength(255)
  name: string;

  @ApiProperty({
    description: 'Descrição do hábito',
    required: false,
    example: 'Manter consistência nos estudos diários',
  })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({
    description: 'Tipo de hábito',
    required: false,
    enum: HabitType,
    example: HabitType.STUDY_TIME,
  })
  @IsOptional()
  @IsEnum(HabitType)
  type?: HabitType;

  @ApiProperty({
    description: 'Frequência do hábito',
    required: false,
    enum: HabitFrequency,
    example: HabitFrequency.DAILY,
  })
  @IsOptional()
  @IsEnum(HabitFrequency)
  frequency?: HabitFrequency;

  @ApiProperty({
    description: 'Valor alvo (ex: 25 minutos, 3 sessões)',
    required: false,
    example: 25,
  })
  @IsOptional()
  @IsInt()
  targetValue?: number;

  @ApiProperty({
    description: 'Cor em hexadecimal',
    required: false,
    example: '#3B82F6',
  })
  @IsOptional()
  @IsString()
  @MaxLength(7)
  color?: string;

  @ApiProperty({
    description: 'Ícone/emoji para o hábito',
    required: false,
    example: '📚',
  })
  @IsOptional()
  @IsString()
  @MaxLength(10)
  icon?: string;

  @ApiProperty({
    description: 'Data de início',
    required: false,
  })
  @IsOptional()
  @IsDateString()
  startDate?: string;

  @ApiProperty({
    description: 'Data limite (opcional)',
    required: false,
  })
  @IsOptional()
  @IsDateString()
  endDate?: string;

  @ApiProperty({
    description: 'Dias da semana para frequência customizada (ex: "1,3,5" para seg, qua, sex)',
    required: false,
    example: '1,3,5',
  })
  @IsOptional()
  @IsString()
  customDays?: string;

  @ApiProperty({
    description: 'ID do assunto relacionado (opcional)',
    required: false,
    example: 1,
  })
  @IsOptional()
  @IsInt()
  topicId?: number;
}


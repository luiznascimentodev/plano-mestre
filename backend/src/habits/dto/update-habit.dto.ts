import { ApiProperty } from '@nestjs/swagger';
import {
  IsOptional,
  IsString,
  IsEnum,
  IsInt,
  IsBoolean,
  IsDateString,
  MaxLength,
} from 'class-validator';
import { HabitType, HabitFrequency } from '@prisma/client';

export class UpdateHabitDto {
  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  name?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({ required: false, enum: HabitType })
  @IsOptional()
  @IsEnum(HabitType)
  type?: HabitType;

  @ApiProperty({ required: false, enum: HabitFrequency })
  @IsOptional()
  @IsEnum(HabitFrequency)
  frequency?: HabitFrequency;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsInt()
  targetValue?: number;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  @MaxLength(7)
  color?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  @MaxLength(10)
  icon?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsDateString()
  startDate?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsDateString()
  endDate?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  customDays?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsInt()
  topicId?: number;
}


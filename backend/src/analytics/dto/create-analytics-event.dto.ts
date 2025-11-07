import { ApiProperty } from '@nestjs/swagger';
import {
  IsNotEmpty,
  IsEnum,
  IsOptional,
  IsString,
  IsInt,
  IsObject,
} from 'class-validator';
import { AnalyticsEventType } from '@prisma/client';

export class CreateAnalyticsEventDto {
  @ApiProperty({
    description: 'Tipo do evento',
    enum: AnalyticsEventType,
    example: AnalyticsEventType.STUDY_SESSION_STARTED,
  })
  @IsEnum(AnalyticsEventType)
  @IsNotEmpty()
  eventType: AnalyticsEventType;

  @ApiProperty({
    description: 'Tipo da entidade relacionada (ex: "topic", "flashcard")',
    required: false,
    example: 'topic',
  })
  @IsOptional()
  @IsString()
  entityType?: string;

  @ApiProperty({
    description: 'ID da entidade relacionada',
    required: false,
    example: 1,
  })
  @IsOptional()
  @IsInt()
  entityId?: number;

  @ApiProperty({
    description: 'Metadados adicionais em JSON',
    required: false,
    example: { duration: 25, topicName: 'Crase' },
  })
  @IsOptional()
  @IsObject()
  metadata?: Record<string, any>;

  @ApiProperty({
    description: 'Duração em segundos (para ações com duração)',
    required: false,
    example: 1500,
  })
  @IsOptional()
  @IsInt()
  duration?: number;
}


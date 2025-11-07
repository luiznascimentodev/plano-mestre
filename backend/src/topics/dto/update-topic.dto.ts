import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsString, IsEnum, IsDateString, MaxLength } from 'class-validator';
import { TopicPriority } from '@prisma/client';

export class UpdateTopicDto {
  @ApiProperty({
    description: 'Notas sobre o assunto',
    required: false,
  })
  @IsOptional()
  @IsString()
  notes?: string;

  @ApiProperty({
    description: 'Nome do assunto',
    required: false,
  })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  name?: string;

  @ApiProperty({
    description: 'Categoria do assunto',
    required: false,
  })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  category?: string;

  @ApiProperty({
    description: 'Prioridade do assunto',
    required: false,
    enum: TopicPriority,
  })
  @IsOptional()
  @IsEnum(TopicPriority)
  priority?: TopicPriority;

  @ApiProperty({
    description: 'Data limite para conclusão',
    required: false,
  })
  @IsOptional()
  @IsDateString()
  dueDate?: string;

  @ApiProperty({
    description: 'Descrição do assunto',
    required: false,
  })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  description?: string;

  @ApiProperty({
    description: 'Tags separadas por vírgula',
    required: false,
  })
  @IsOptional()
  @IsString()
  @MaxLength(200)
  tags?: string;

  @ApiProperty({
    description: 'Cor em hexadecimal',
    required: false,
  })
  @IsOptional()
  @IsString()
  @MaxLength(7)
  color?: string;
}


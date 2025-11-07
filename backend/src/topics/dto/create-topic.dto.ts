import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, MaxLength, IsOptional, IsEnum, IsDateString } from 'class-validator';
import { TopicPriority } from '@prisma/client';

export class CreateTopicDto {
  @ApiProperty({
    description: 'Nome do Assunto que será estudado',
    example: 'Controle de Constitucionalidade',
  })
  @IsString()
  @IsNotEmpty({ message: 'O nome não pode estar vazio.' })
  @MaxLength(255)
  name: string;

  @ApiProperty({
    description: 'Categoria do assunto (ex: Direito, Matemática, Português)',
    required: false,
    example: 'Direito Constitucional',
  })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  category?: string;

  @ApiProperty({
    description: 'Prioridade do assunto',
    required: false,
    enum: TopicPriority,
    example: TopicPriority.HIGH,
  })
  @IsOptional()
  @IsEnum(TopicPriority)
  priority?: TopicPriority;

  @ApiProperty({
    description: 'Data limite para conclusão do assunto (ISO 8601)',
    required: false,
    example: '2025-12-31T23:59:59Z',
  })
  @IsOptional()
  @IsDateString()
  dueDate?: string;

  @ApiProperty({
    description: 'Descrição breve do assunto',
    required: false,
    example: 'Estudar os principais conceitos de controle de constitucionalidade',
  })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  description?: string;

  @ApiProperty({
    description: 'Tags separadas por vírgula para organização e busca',
    required: false,
    example: 'constitucional, direito, prova',
  })
  @IsOptional()
  @IsString()
  @MaxLength(200)
  tags?: string;

  @ApiProperty({
    description: 'Cor em hexadecimal para personalização visual',
    required: false,
    example: '#3B82F6',
  })
  @IsOptional()
  @IsString()
  @MaxLength(7)
  color?: string;
}

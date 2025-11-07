import { ApiProperty } from '@nestjs/swagger';
import {
  IsNotEmpty,
  IsString,
  IsInt,
  IsEnum,
  IsOptional,
} from 'class-validator';
import { FlashcardDifficulty } from '@prisma/client';

export class CreateFlashcardDto {
  @ApiProperty({
    description: 'Frente do flashcard (pergunta)',
    example: 'O que é SOLID?',
  })
  @IsNotEmpty({ message: 'A frente do flashcard não pode estar vazia.' })
  @IsString()
  front: string;

  @ApiProperty({
    description: 'Verso do flashcard (resposta)',
    example:
      'SOLID são 5 princípios de design de software: Single Responsibility, Open/Closed, Liskov Substitution, Interface Segregation, Dependency Inversion.',
  })
  @IsNotEmpty({ message: 'O verso do flashcard não pode estar vazio.' })
  @IsString()
  back: string;

  @ApiProperty({
    description: 'ID do assunto (Topic) relacionado',
    example: 1,
  })
  @IsNotEmpty()
  @IsInt()
  topicId: number;

  @ApiProperty({
    description: 'Dificuldade inicial do flashcard',
    enum: FlashcardDifficulty,
    example: FlashcardDifficulty.MEDIUM,
    required: false,
  })
  @IsOptional()
  @IsEnum(FlashcardDifficulty)
  difficulty?: FlashcardDifficulty;
}


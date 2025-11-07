import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsEnum, IsOptional } from 'class-validator';
import { FlashcardDifficulty } from '@prisma/client';

export class UpdateFlashcardDto {
  @ApiProperty({
    description: 'Frente do flashcard (pergunta)',
    required: false,
  })
  @IsOptional()
  @IsString()
  front?: string;

  @ApiProperty({
    description: 'Verso do flashcard (resposta)',
    required: false,
  })
  @IsOptional()
  @IsString()
  back?: string;

  @ApiProperty({
    description: 'Dificuldade do flashcard',
    enum: FlashcardDifficulty,
    required: false,
  })
  @IsOptional()
  @IsEnum(FlashcardDifficulty)
  difficulty?: FlashcardDifficulty;
}


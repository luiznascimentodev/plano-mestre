import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsNotEmpty } from 'class-validator';
import { FlashcardDifficulty } from '@prisma/client';

export class ReviewFlashcardDto {
  @ApiProperty({
    description: 'Dificuldade percebida na revisão',
    enum: FlashcardDifficulty,
    example: FlashcardDifficulty.EASY,
  })
  @IsNotEmpty()
  @IsEnum(FlashcardDifficulty)
  difficulty: FlashcardDifficulty;
}


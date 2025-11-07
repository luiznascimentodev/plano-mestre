import { ApiProperty } from '@nestjs/swagger';
import { IsInt, IsNotEmpty, IsPositive } from 'class-validator';

export class CreateStudySessionDto{
  @ApiProperty({
    description: 'Duração da sessão em minutos',
    example: 25,
  })
  @IsInt()
  @IsPositive()
  duration: number;

  @ApiProperty({
    description: 'ID do "Topic"(Assunto) que foi estudado',
    example: 1,
  })
  @IsInt()
  @IsNotEmpty()
  topicId: number;
}

import { IsNotEmpty, IsString, MaxLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateSuggestionDto {
  @ApiProperty({
    description: 'Assunto da sugestão',
    example: 'Sugestão de nova funcionalidade',
    maxLength: 200,
  })
  @IsNotEmpty({ message: 'O assunto é obrigatório.' })
  @IsString()
  @MaxLength(200, { message: 'O assunto deve ter no máximo 200 caracteres.' })
  subject: string;

  @ApiProperty({
    description: 'Mensagem da sugestão',
    example: 'Gostaria de sugerir uma funcionalidade para...',
    maxLength: 2000,
  })
  @IsNotEmpty({ message: 'A mensagem é obrigatória.' })
  @IsString()
  @MaxLength(2000, { message: 'A mensagem deve ter no máximo 2000 caracteres.' })
  message: string;
}


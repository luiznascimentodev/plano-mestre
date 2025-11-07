import { ApiProperty } from '@nestjs/swagger';
import {
  IsEmail,
  IsNotEmpty,
  IsString,
  MinLength,
  Matches,
  MaxLength,
} from 'class-validator';

export class RegisterAuthDto {
  @ApiProperty({ description: 'Nome do usuário', example: 'Luiz Nascimento' })
  @IsNotEmpty({ message: 'O nome não pode estar vazio.' })
  @IsString()
  @MaxLength(100, { message: 'O nome deve ter no máximo 100 caracteres.' })
  name: string;

  @ApiProperty({
    description: 'E-mail único do usuário',
    example: 'luiz@email.com',
  })
  @IsNotEmpty()
  @IsEmail({}, { message: 'Por favor, insira um e-mail válido.' })
  @MaxLength(255, { message: 'O e-mail deve ter no máximo 255 caracteres.' })
  email: string;

  @ApiProperty({
    description: 'Senha do usuário (mínimo 8 caracteres, deve conter letras e números)',
    example: 'MinhaSenh@123',
  })
  @IsNotEmpty()
  @IsString()
  @MinLength(8, { message: 'A senha deve conter pelo menos 8 caracteres.' })
  @MaxLength(128, { message: 'A senha deve ter no máximo 128 caracteres.' })
  @Matches(
    /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/,
    {
      message:
        'A senha deve conter pelo menos uma letra minúscula, uma maiúscula e um número.',
    },
  )
  password: string;
}

import { ApiProperty } from '@nestjs/swagger';
import {
  IsEmail,
  IsNotEmpty,
  IsString,
  MinLength,
  MaxLength,
} from 'class-validator';

export class LoginAuthDto {
  @ApiProperty({
    description: 'E-mail do usuário',
    example: 'luiz@email.com',
  })
  @IsNotEmpty()
  @IsEmail({}, { message: 'Por favor, insira um e-mail válido.' })
  @MaxLength(255, { message: 'O e-mail deve ter no máximo 255 caracteres.' })
  email: string;

  @ApiProperty({ description: 'Senha do usuário', example: 'MinhaSenh@123' })
  @IsNotEmpty()
  @IsString()
  @MinLength(1, { message: 'A senha é obrigatória.' })
  @MaxLength(128, { message: 'A senha deve ter no máximo 128 caracteres.' })
  password: string;
}

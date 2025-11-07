import { Controller, Get, UseGuards } from '@nestjs/common';
import { AppService } from './app.service';
import { AuthGuard } from '@nestjs/passport';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import type { User } from '@prisma/client';
import { GetUser } from './auth/get-user.decorator';

@ApiTags('App')
@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get('hello-publico')
  getHello(): string {
    return this.appService.getHello();
  }

  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth()
  @ApiTags('2. Teste Rota Protegida')
  @Get('perfil')
  getProfile(@GetUser() user: User) {
    // Removido console.log por segurança (não logar dados sensíveis)
    // Retornar apenas dados necessários, sem informações sensíveis
    const { password, ...safeUser } = user;
    return safeUser;
  }
}

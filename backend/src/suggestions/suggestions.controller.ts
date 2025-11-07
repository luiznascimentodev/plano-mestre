import {
  Controller,
  Post,
  Body,
  UseGuards,
  ValidationPipe,
  UsePipes,
} from '@nestjs/common';
import { SuggestionsService } from './suggestions.service';
import { CreateSuggestionDto } from './dto/create-suggestion.dto';
import { AuthGuard } from '@nestjs/passport';
import { GetUser } from '../auth/get-user.decorator';
import { User } from '@prisma/client';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';

@ApiTags('Sugestões')
@ApiBearerAuth()
@Controller('suggestions')
@UseGuards(AuthGuard('jwt'))
export class SuggestionsController {
  constructor(private readonly suggestionsService: SuggestionsService) {}

  @Post()
  @UsePipes(new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true }))
  @ApiOperation({ summary: 'Enviar uma sugestão ou feedback' })
  @ApiResponse({
    status: 201,
    description: 'Sugestão enviada com sucesso.',
  })
  @ApiResponse({
    status: 400,
    description: 'Dados inválidos.',
  })
  @ApiResponse({
    status: 401,
    description: 'Não autorizado.',
  })
  async create(@GetUser() user: User, @Body() dto: CreateSuggestionDto) {
    return this.suggestionsService.create(user.id, dto);
  }
}


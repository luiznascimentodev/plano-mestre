import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  ParseIntPipe,
  Query,
  UseGuards,
} from '@nestjs/common';
import { FlashcardsService } from './flashcards.service';
import { CreateFlashcardDto } from './dto/create-flashcard.dto';
import { UpdateFlashcardDto } from './dto/update-flashcard.dto';
import { ReviewFlashcardDto } from './dto/review-flashcard.dto';
import { AuthGuard } from '@nestjs/passport';
import { ApiBearerAuth, ApiOperation, ApiTags, ApiQuery } from '@nestjs/swagger';
import { GetUser } from '../auth/get-user.decorator';
import { User } from '@prisma/client';

@ApiTags('5. Flashcards (Revisões)')
@ApiBearerAuth()
@UseGuards(AuthGuard('jwt'))
@Controller('flashcards')
export class FlashcardsController {
  constructor(private readonly flashcardsService: FlashcardsService) {}

  @Post()
  @ApiOperation({ summary: 'Criar um novo flashcard' })
  create(@Body() createFlashcardDto: CreateFlashcardDto, @GetUser() user: User) {
    return this.flashcardsService.create(createFlashcardDto, user.id);
  }

  @Get()
  @ApiOperation({ summary: 'Listar todos os flashcards do usuário' })
  @ApiQuery({
    name: 'topicId',
    required: false,
    type: Number,
    description: 'Filtrar por assunto específico',
  })
  @ApiQuery({
    name: 'due',
    required: false,
    type: Boolean,
    description: 'Apenas flashcards que precisam ser revisados',
  })
  findAll(
    @GetUser() user: User,
    @Query('topicId') topicId?: string,
    @Query('due') due?: string,
  ) {
    const topicIdNum = topicId ? parseInt(topicId, 10) : undefined;
    const isDue = due === 'true';

    if (isDue) {
      return this.flashcardsService.findDueForReview(user.id, topicIdNum);
    }

    return this.flashcardsService.findAll(user.id, topicIdNum);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Buscar um flashcard específico' })
  findOne(@Param('id', ParseIntPipe) id: number, @GetUser() user: User) {
    return this.flashcardsService.findOne(id, user.id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Atualizar um flashcard' })
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateFlashcardDto: UpdateFlashcardDto,
    @GetUser() user: User,
  ) {
    return this.flashcardsService.update(id, updateFlashcardDto, user.id);
  }

  @Post(':id/review')
  @ApiOperation({
    summary: 'Registrar uma revisão do flashcard (algoritmo de repetição espaçada)',
  })
  review(
    @Param('id', ParseIntPipe) id: number,
    @Body() reviewFlashcardDto: ReviewFlashcardDto,
    @GetUser() user: User,
  ) {
    return this.flashcardsService.review(id, reviewFlashcardDto, user.id);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Remover um flashcard' })
  remove(@Param('id', ParseIntPipe) id: number, @GetUser() user: User) {
    return this.flashcardsService.remove(id, user.id);
  }
}


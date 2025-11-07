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
import { HabitsService } from './habits.service';
import { CreateHabitDto } from './dto/create-habit.dto';
import { UpdateHabitDto } from './dto/update-habit.dto';
import { CompleteHabitDto } from './dto/complete-habit.dto';
import { AuthGuard } from '@nestjs/passport';
import { ApiBearerAuth, ApiOperation, ApiTags, ApiQuery } from '@nestjs/swagger';
import { GetUser } from '../auth/get-user.decorator';
import { User } from '@prisma/client';

@ApiTags('7. Hábitos')
@ApiBearerAuth()
@UseGuards(AuthGuard('jwt'))
@Controller('habits')
export class HabitsController {
  constructor(private readonly habitsService: HabitsService) {}

  @Post()
  @ApiOperation({ summary: 'Criar um novo hábito' })
  create(@Body() createHabitDto: CreateHabitDto, @GetUser() user: User) {
    return this.habitsService.create(createHabitDto, user.id);
  }

  @Get()
  @ApiOperation({ summary: 'Listar todos os hábitos do usuário' })
  @ApiQuery({
    name: 'includeInactive',
    required: false,
    type: Boolean,
    description: 'Incluir hábitos inativos',
  })
  findAll(
    @GetUser() user: User,
    @Query('includeInactive') includeInactive?: string,
  ) {
    return this.habitsService.findAll(
      user.id,
      includeInactive === 'true',
    );
  }

  @Get(':id')
  @ApiOperation({ summary: 'Buscar um hábito específico' })
  findOne(@Param('id', ParseIntPipe) id: number, @GetUser() user: User) {
    return this.habitsService.findOne(id, user.id);
  }

  @Get(':id/stats')
  @ApiOperation({ summary: 'Obter estatísticas de um hábito' })
  getStats(@Param('id', ParseIntPipe) id: number, @GetUser() user: User) {
    return this.habitsService.getStats(id, user.id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Atualizar um hábito' })
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateHabitDto: UpdateHabitDto,
    @GetUser() user: User,
  ) {
    return this.habitsService.update(id, updateHabitDto, user.id);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Excluir um hábito' })
  remove(@Param('id', ParseIntPipe) id: number, @GetUser() user: User) {
    return this.habitsService.remove(id, user.id);
  }

  @Post(':id/complete')
  @ApiOperation({ summary: 'Marcar hábito como completado' })
  complete(
    @Param('id', ParseIntPipe) id: number,
    @Body() completeHabitDto: CompleteHabitDto,
    @GetUser() user: User,
  ) {
    return this.habitsService.complete(id, completeHabitDto, user.id);
  }

  @Delete(':id/completions/:completionId')
  @ApiOperation({ summary: 'Remover uma conclusão de hábito' })
  uncomplete(
    @Param('id', ParseIntPipe) id: number,
    @Param('completionId', ParseIntPipe) completionId: number,
    @GetUser() user: User,
  ) {
    return this.habitsService.uncomplete(id, completionId, user.id);
  }
}


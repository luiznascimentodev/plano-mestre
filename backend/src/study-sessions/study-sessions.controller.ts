import { Controller, Post, Body, UseGuards, Get, Query } from '@nestjs/common';
import { StudySessionsService } from './study-sessions.service';
import { CreateStudySessionDto } from './dto/create-session.dto';
import { AuthGuard } from '@nestjs/passport';
import { ApiBearerAuth, ApiOperation, ApiTags, ApiQuery } from '@nestjs/swagger';
import { GetUser } from '../auth/get-user.decorator';
import { User } from '@prisma/client';

@ApiTags('4. Sessões de Estudo (Pomodoro)')
@ApiBearerAuth()
@UseGuards(AuthGuard('jwt'))
@Controller('study-sessions')
export class StudySessionsController {
  constructor(private readonly studySessionService: StudySessionsService) {}

  @Post()
  @ApiOperation({
    summary: 'Registrar uma sessão de estudo (ex: Pomodoro)',
  })
  create(
    @Body() createStudySessionDto: CreateStudySessionDto,
    @GetUser() user: User,
  ) {
    return this.studySessionService.create(createStudySessionDto, user.id);
  }

  @Get()
  @ApiOperation({
    summary: 'Listar todas as sessões de estudo do usuário',
  })
  @ApiQuery({
    name: 'stats',
    required: false,
    type: String,
    description: 'Tipo de estatísticas: "daily", "weekly" ou "advanced"',
  })
  @ApiQuery({
    name: 'date',
    required: false,
    type: String,
    description: 'Data no formato YYYY-MM-DD (para stats=daily ou advanced)',
  })
  @ApiQuery({
    name: 'days',
    required: false,
    type: Number,
    description: 'Número de dias (para stats=weekly, padrão: 7)',
  })
  findAll(
    @GetUser() user: User,
    @Query('stats') stats?: string,
    @Query('date') date?: string,
    @Query('days') days?: string,
  ) {
    if (stats === 'daily') {
      const targetDate = date ? new Date(date) : new Date();
      return this.studySessionService.getDailyStats(user.id, targetDate);
    }

    if (stats === 'advanced') {
      const targetDate = date ? new Date(date) : new Date();
      return this.studySessionService.getAdvancedDailyMetrics(user.id, targetDate);
    }

    if (stats === 'weekly') {
      const daysNum = days ? parseInt(days, 10) : 7;
      return this.studySessionService.getWeeklyStats(user.id, daysNum);
    }

    return this.studySessionService.findAll(user.id);
  }
}

import {
  Controller,
  Get,
  Post,
  Body,
  Delete,
  Param,
  ParseIntPipe,
  Query,
  UseGuards,
  Patch,
} from '@nestjs/common';
import { ScheduledSessionsService } from './scheduled-sessions.service';
import { CreateScheduledSessionDto } from './dto/create-scheduled-session.dto';
import { UpdateScheduledSessionDto } from './dto/update-scheduled-session.dto';
import { AuthGuard } from '@nestjs/passport';
import { ApiBearerAuth, ApiOperation, ApiTags, ApiQuery } from '@nestjs/swagger';
import { GetUser } from '../auth/get-user.decorator';
import { User } from '@prisma/client';

@ApiTags('6. Sessões Agendadas')
@ApiBearerAuth()
@UseGuards(AuthGuard('jwt'))
@Controller('scheduled-sessions')
export class ScheduledSessionsController {
  constructor(
    private readonly scheduledSessionsService: ScheduledSessionsService,
  ) {}

  @Post()
  @ApiOperation({ summary: 'Agendar uma nova sessão de estudo' })
  create(
    @Body() createScheduledSessionDto: CreateScheduledSessionDto,
    @GetUser() user: User,
  ) {
    return this.scheduledSessionsService.create(createScheduledSessionDto, user.id);
  }

  @Get()
  @ApiOperation({ summary: 'Listar sessões agendadas' })
  @ApiQuery({
    name: 'date',
    required: false,
    type: String,
    description: 'Data no formato YYYY-MM-DD (filtra por dia específico)',
  })
  @ApiQuery({
    name: 'startDate',
    required: false,
    type: String,
    description: 'Data inicial no formato YYYY-MM-DD (para busca por período)',
  })
  @ApiQuery({
    name: 'endDate',
    required: false,
    type: String,
    description: 'Data final no formato YYYY-MM-DD (para busca por período)',
  })
  @ApiQuery({
    name: 'includeCompleted',
    required: false,
    type: Boolean,
    description: 'Incluir sessões completadas',
  })
  findAll(
    @GetUser() user: User,
    @Query('date') date?: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
    @Query('includeCompleted') includeCompleted?: string,
  ) {
    const includeCompletedBool = includeCompleted === 'true';

    if (startDate && endDate) {
      const start = new Date(startDate);
      const end = new Date(endDate);
      end.setHours(23, 59, 59, 999);
      return this.scheduledSessionsService.findByPeriod(
        user.id,
        start,
        end,
        includeCompletedBool,
      );
    }

    const targetDate = date ? new Date(date) : undefined;
    return this.scheduledSessionsService.findAll(
      user.id,
      targetDate,
      includeCompletedBool,
    );
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Atualizar uma sessão agendada' })
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateScheduledSessionDto: UpdateScheduledSessionDto,
    @GetUser() user: User,
  ) {
    return this.scheduledSessionsService.update(
      id,
      updateScheduledSessionDto,
      user.id,
    );
  }

  @Patch(':id/complete')
  @ApiOperation({ summary: 'Marcar sessão agendada como concluída' })
  markAsCompleted(
    @Param('id', ParseIntPipe) id: number,
    @GetUser() user: User,
  ) {
    return this.scheduledSessionsService.markAsCompleted(id, user.id);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Remover uma sessão agendada' })
  remove(@Param('id', ParseIntPipe) id: number, @GetUser() user: User) {
    return this.scheduledSessionsService.remove(id, user.id);
  }
}


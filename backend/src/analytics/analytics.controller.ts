import {
  Controller,
  Post,
  Body,
  Get,
  Query,
  UseGuards,
  Req,
} from '@nestjs/common';
import { AnalyticsService } from './analytics.service';
import { CreateAnalyticsEventDto } from './dto/create-analytics-event.dto';
import { AuthGuard } from '@nestjs/passport';
import { ApiBearerAuth, ApiOperation, ApiTags, ApiQuery } from '@nestjs/swagger';
import { GetUser } from '../auth/get-user.decorator';
import { User } from '@prisma/client';
import { Request } from 'express';

@ApiTags('8. Analytics (Tracking)')
@ApiBearerAuth()
@UseGuards(AuthGuard('jwt'))
@Controller('analytics')
export class AnalyticsController {
  constructor(private readonly analyticsService: AnalyticsService) {}

  @Post('track')
  @ApiOperation({ summary: 'Registrar um evento de analytics' })
  track(
    @Body() createEventDto: CreateAnalyticsEventDto,
    @GetUser() user: User,
    @Req() req: Request,
  ) {
    const userAgent = req.headers['user-agent'];
    const ipAddress = req.ip || req.socket.remoteAddress;
    const sessionId = (req.headers['x-session-id'] as string) || undefined;

    return this.analyticsService.trackEvent(
      createEventDto,
      user.id,
      userAgent,
      ipAddress,
      sessionId,
    );
  }

  @Get('daily')
  @ApiOperation({ summary: 'Obter estatísticas diárias de analytics' })
  @ApiQuery({
    name: 'date',
    required: false,
    type: String,
    description: 'Data no formato YYYY-MM-DD',
  })
  getDailyStats(@GetUser() user: User, @Query('date') date?: string) {
    const targetDate = date ? new Date(date) : new Date();
    return this.analyticsService.getDailyStats(user.id, targetDate);
  }

  @Get('weekly')
  @ApiOperation({ summary: 'Obter estatísticas semanais de analytics' })
  @ApiQuery({
    name: 'days',
    required: false,
    type: Number,
    description: 'Número de dias (padrão: 7)',
  })
  getWeeklyStats(@GetUser() user: User, @Query('days') days?: string) {
    const daysNum = days ? parseInt(days, 10) : 7;
    return this.analyticsService.getWeeklyStats(user.id, daysNum);
  }

  @Get('features')
  @ApiOperation({ summary: 'Obter estatísticas de uso de features' })
  @ApiQuery({
    name: 'days',
    required: false,
    type: Number,
    description: 'Número de dias (padrão: 30)',
  })
  getFeatureUsage(@GetUser() user: User, @Query('days') days?: string) {
    const daysNum = days ? parseInt(days, 10) : 30;
    return this.analyticsService.getFeatureUsageStats(user.id, daysNum);
  }

  @Get('engagement')
  @ApiOperation({ summary: 'Obter métricas de engajamento' })
  @ApiQuery({
    name: 'days',
    required: false,
    type: Number,
    description: 'Número de dias (padrão: 30)',
  })
  getEngagement(@GetUser() user: User, @Query('days') days?: string) {
    const daysNum = days ? parseInt(days, 10) : 30;
    return this.analyticsService.getEngagementMetrics(user.id, daysNum);
  }
}


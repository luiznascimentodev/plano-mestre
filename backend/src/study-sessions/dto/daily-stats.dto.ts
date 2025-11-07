import { ApiProperty } from '@nestjs/swagger';

export class DailyStatsDto {
  @ApiProperty({ description: 'Data do dia' })
  date: string;

  @ApiProperty({ description: 'Total de minutos estudados no dia' })
  totalMinutes: number;

  @ApiProperty({ description: 'Número de sessões completadas' })
  sessionCount: number;

  @ApiProperty({ description: 'Assuntos estudados (IDs únicos)' })
  topicsStudied: number;

  @ApiProperty({
    description: 'Sessões agrupadas por assunto',
    type: 'array',
    items: {
      type: 'object',
      properties: {
        topicId: { type: 'number' },
        topicName: { type: 'string' },
        totalMinutes: { type: 'number' },
        sessionCount: { type: 'number' },
      },
    },
  })
  byTopic: Array<{
    topicId: number;
    topicName: string;
    totalMinutes: number;
    sessionCount: number;
  }>;
}


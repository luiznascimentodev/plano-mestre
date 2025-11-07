// /backend/src/topics/topics.controller.ts
import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Delete,
  UseGuards,
  Param,
  ParseIntPipe,
} from '@nestjs/common';
import { TopicsService } from './topics.service';
import { CreateTopicDto } from './dto/create-topic.dto';
import { UpdateTopicDto } from './dto/update-topic.dto';
import { AuthGuard } from '@nestjs/passport'; // O "Guardião" que fizemos na Fase 1
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { GetUser } from '../auth/get-user.decorator'; // O decorator da Fase 1
import { User } from '@prisma/client';

@ApiTags('3. Assuntos (Topics)') // Agrupador do Swagger
@ApiBearerAuth() // Diz ao Swagger que esta rota precisa de Token
@UseGuards(AuthGuard('jwt')) // Prática Consolidada: Protege TODAS as rotas
@Controller('topics') // A URL base será /topics
export class TopicController {
  constructor(private readonly topicService: TopicsService) {}

  @Post() // Responde a POST /topics
  @ApiOperation({ summary: 'Criar um novo assunto de estudo' })
  create(
    @Body() createTopicDto: CreateTopicDto, // Pega o body e VALIDA
    @GetUser() user: User, // Pega o usuário do Token (graças ao decorator)
  ) {
    // Passa o DTO e o ID do usuário para o Service
    return this.topicService.create(createTopicDto, user.id);
  }

  @Get() // Responde a GET /topics
  @ApiOperation({ summary: 'Listar todos os assuntos do usuário' })
  findAll(@GetUser() user: User) {
    // Apenas pede ao Service os 'topics' do usuário
    return this.topicService.findAll(user.id);
  }

  @Get(':id') // Responde a GET /topics/123
  @ApiOperation({ summary: 'Buscar um assunto específico por ID' })
  findOne(
    @Param('id', ParseIntPipe) id: number, // Pega o 'id' da URL e VALIDA se é um número
    @GetUser() user: User,
  ) {
    return this.topicService.findOne(id, user.id);
  }

  @Patch(':id') // Responde a PATCH /topics/123
  @ApiOperation({ summary: 'Atualizar um assunto (notas)' })
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateTopicDto: UpdateTopicDto,
    @GetUser() user: User,
  ) {
    return this.topicService.update(id, updateTopicDto, user.id);
  }

  @Delete(':id') // Responde a DELETE /topics/123
  @ApiOperation({ summary: 'Excluir um assunto' })
  remove(@Param('id', ParseIntPipe) id: number, @GetUser() user: User) {
    return this.topicService.remove(id, user.id);
  }
}

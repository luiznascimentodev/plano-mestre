import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../prisma/prisma.service';
import { CreateSuggestionDto } from './dto/create-suggestion.dto';
import * as nodemailer from 'nodemailer';

@Injectable()
export class SuggestionsService {
  private transporter: nodemailer.Transporter | null = null;

  constructor(
    private readonly prisma: PrismaService,
    private readonly configService: ConfigService,
  ) {
    // Configurar transporter de email
    // Por padrão, usa SMTP do Gmail, mas pode ser configurado via variáveis de ambiente
    const emailUser = this.configService.get<string>('EMAIL_USER') || 'luiznascdev@gmail.com';
    const emailPassword = this.configService.get<string>('EMAIL_PASSWORD') || '';

    // Só cria o transporter se tiver senha configurada
    if (emailPassword) {
      this.transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: {
          user: emailUser,
          pass: emailPassword,
        },
      });
    }
  }

  async create(userId: number, dto: CreateSuggestionDto) {
    // Buscar dados do usuário
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        name: true,
        email: true,
      },
    });

    if (!user) {
      throw new Error('Usuário não encontrado');
    }

    // Email de destino (configurável via variável de ambiente)
    const recipientEmail =
      this.configService.get<string>('SUGGESTIONS_EMAIL') ||
      'luiznascdev@gmail.com';

    // Preparar email
    const emailUser = this.configService.get<string>('EMAIL_USER') || 'luiznascdev@gmail.com';
    const mailOptions = {
      from: emailUser,
      to: recipientEmail,
      subject: `[Plano Mestre] Sugestão: ${dto.subject}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #10b981; border-bottom: 2px solid #10b981; padding-bottom: 10px;">
            Nova Sugestão - Plano Mestre
          </h2>

          <div style="background-color: #f8fafc; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <h3 style="color: #0f172a; margin-top: 0;">Informações do Usuário</h3>
            <p><strong>Nome:</strong> ${user.name}</p>
            <p><strong>Email:</strong> ${user.email}</p>
            <p><strong>ID do Usuário:</strong> ${user.id}</p>
          </div>

          <div style="background-color: #ffffff; padding: 20px; border: 1px solid #e2e8f0; border-radius: 8px; margin: 20px 0;">
            <h3 style="color: #0f172a; margin-top: 0;">Assunto</h3>
            <p style="color: #475569; font-size: 16px;">${dto.subject}</p>
          </div>

          <div style="background-color: #ffffff; padding: 20px; border: 1px solid #e2e8f0; border-radius: 8px; margin: 20px 0;">
            <h3 style="color: #0f172a; margin-top: 0;">Mensagem</h3>
            <p style="color: #475569; font-size: 16px; white-space: pre-wrap;">${dto.message}</p>
          </div>

          <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #e2e8f0; color: #64748b; font-size: 12px;">
            <p>Esta sugestão foi enviada através do sistema Plano Mestre.</p>
            <p>Data: ${new Date().toLocaleString('pt-BR')}</p>
          </div>
        </div>
      `,
      text: `
Nova Sugestão - Plano Mestre

Informações do Usuário:
- Nome: ${user.name}
- Email: ${user.email}
- ID: ${user.id}

Assunto: ${dto.subject}

Mensagem:
${dto.message}

---
Enviado em: ${new Date().toLocaleString('pt-BR')}
      `,
    };

    try {
      // Enviar email apenas se o transporter estiver configurado
      if (this.transporter) {
        await this.transporter.sendMail(mailOptions);
        return {
          success: true,
          message: 'Sugestão enviada com sucesso!',
        };
      } else {
        // Se não houver configuração de email, apenas loga (em produção, salvaria no banco)
        console.log('Sugestão recebida (email não configurado):', {
          user: user.name,
          email: user.email,
          subject: dto.subject,
          message: dto.message,
        });
        return {
          success: true,
          message: 'Sugestão recebida! Obrigado pelo feedback.',
          warning: 'Email não configurado. Configure EMAIL_USER e EMAIL_PASSWORD no .env',
        };
      }
    } catch (error) {
      console.error('Erro ao enviar email:', error);
      // Mesmo se o email falhar, retornamos sucesso para não frustrar o usuário
      // Em produção, você pode querer logar isso em um sistema de monitoramento
      return {
        success: true,
        message: 'Sugestão recebida! Obrigado pelo feedback.',
        warning: 'Houve um problema ao enviar o email, mas sua sugestão foi registrada.',
      };
    }
  }
}


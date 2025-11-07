<div align="center">

# 📚 Plano Mestre

**Sua plataforma completa de estudos inteligente**

[![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?style=for-the-badge&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Next.js](https://img.shields.io/badge/Next.js-000000?style=for-the-badge&logo=next.js&logoColor=white)](https://nextjs.org/)
[![NestJS](https://img.shields.io/badge/NestJS-E0234E?style=for-the-badge&logo=nestjs&logoColor=white)](https://nestjs.com/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-316192?style=for-the-badge&logo=postgresql&logoColor=white)](https://www.postgresql.org/)
[![Prisma](https://img.shields.io/badge/Prisma-2D3748?style=for-the-badge&logo=prisma&logoColor=white)](https://www.prisma.io/)

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg?style=for-the-badge)](https://opensource.org/licenses/MIT)
[![Node.js](https://img.shields.io/badge/Node.js-339933?style=for-the-badge&logo=node.js&logoColor=white)](https://nodejs.org/)

</div>

---

## 📖 Sobre o Projeto

**Plano Mestre** é uma plataforma full-stack de gerenciamento de estudos desenvolvida com arquitetura escalável e padrões de mercado. O projeto demonstra proficiência em desenvolvimento moderno, implementando Clean Architecture, SOLID principles e boas práticas de segurança em produção.

### 🎯 Objetivo

Criar uma solução completa que integra técnicas científicas de aprendizado (Pomodoro, Spaced Repetition) com análise de dados em tempo real, proporcionando uma experiência de estudo otimizada e baseada em evidências.

---

## ✨ Funcionalidades Principais

### 🎓 Gestão de Assuntos
- ✅ Criação e organização de tópicos de estudo
- ✅ Categorização por prioridade, categoria e tags
- ✅ Sistema de cores para personalização visual
- ✅ Acompanhamento de status (Não Iniciado, Em Progresso, Revisando, Concluído)

### ⏱️ Sessões de Estudo
- ✅ Timer Pomodoro integrado (25 minutos de foco)
- ✅ Registro automático de tempo estudado
- ✅ Histórico completo de sessões
- ✅ Estatísticas de tempo por assunto

### 🃏 Flashcards Inteligentes
- ✅ Sistema de repetição espaçada (Spaced Repetition)
- ✅ Dificuldade adaptativa (Fácil, Médio, Difícil)
- ✅ Agendamento automático de revisões
- ✅ Métricas de performance de memorização

### 📅 Planejamento
- ✅ Agendamento de sessões de estudo
- ✅ Calendário visual interativo
- ✅ Notificações de sessões agendadas
- ✅ Gestão de prazos e deadlines

### 🔥 Sistema de Hábitos
- ✅ Criação de hábitos personalizados
- ✅ Frequência configurável (Diário, Semanal, Customizado)
- ✅ Acompanhamento de streaks
- ✅ Estatísticas de completação

### 📊 Analytics Avançado
- ✅ Dashboard com métricas em tempo real
- ✅ Análise de tempo estudado por dia/semana
- ✅ Identificação de horários de pico
- ✅ Insights personalizados sobre produtividade

### 🔐 Segurança
- ✅ Autenticação JWT com refresh tokens
- ✅ Cookies httpOnly para máxima segurança
- ✅ Rate limiting contra ataques de força bruta
- ✅ Auditoria completa de ações (Audit Log)
- ✅ Blacklist de tokens revogados
- ✅ Suporte a 2FA (Two-Factor Authentication)

---

## 🛠️ Stack Tecnológica

### Frontend
- **Framework**: [Next.js 16](https://nextjs.org/) (App Router) - Server Components, RSC
- **Linguagem**: TypeScript (100% tipado)
- **Estilização**: Tailwind CSS 4 (Utility-first, Design System)
- **Estado Global**: Zustand (State Management leve e performático)
- **HTTP Client**: Axios (Interceptors, Error Handling)
- **UI Components**: Heroicons, Componentes customizados

### Backend
- **Framework**: [NestJS 11](https://nestjs.com/) (Modular, Dependency Injection)
- **Linguagem**: TypeScript (Type-safe, Decorators)
- **ORM**: Prisma 6 (Type-safe database client, Migrations)
- **Banco de Dados**: PostgreSQL 15 (Relacional, ACID)
- **Autenticação**: JWT + Refresh Tokens (Passport.js Strategy)
- **Validação**: class-validator, class-transformer (DTO Pattern)
- **Documentação**: Swagger/OpenAPI (Auto-generated API docs)
- **Segurança**: Helmet, Rate Limiting, CORS, Audit Logs

### DevOps & Qualidade
- **Containerização**: Docker & Docker Compose (Ambiente isolado)
- **Versionamento**: Git (Conventional Commits)
- **Code Quality**: ESLint, Prettier (Padronização)
- **Testes**: Jest, Supertest (Unit, Integration, E2E)

---

## 📁 Estrutura do Projeto

```
plano-mestre/
├── frontend/                 # Aplicação Next.js
│   ├── src/
│   │   ├── app/             # Rotas e páginas (App Router)
│   │   │   ├── dashboard/   # Dashboard e funcionalidades
│   │   │   ├── login/       # Autenticação
│   │   │   └── page.tsx     # Landing page
│   │   ├── components/      # Componentes React reutilizáveis
│   │   ├── lib/             # Utilitários e configurações
│   │   ├── store/           # Estado global (Zustand)
│   │   └── styles/          # Estilos globais
│   └── public/              # Arquivos estáticos
│
├── backend/                  # API NestJS
│   ├── src/
│   │   ├── auth/           # Módulo de autenticação
│   │   ├── topics/          # Gestão de assuntos
│   │   ├── study-sessions/  # Sessões de estudo
│   │   ├── flashcards/      # Sistema de flashcards
│   │   ├── habits/          # Gestão de hábitos
│   │   ├── analytics/      # Analytics e métricas
│   │   ├── scheduled-sessions/ # Sessões agendadas
│   │   ├── suggestions/    # Sugestões inteligentes
│   │   └── audit/           # Auditoria de segurança
│   ├── prisma/
│   │   ├── schema.prisma   # Schema do banco de dados
│   │   └── migrations/     # Migrações do Prisma
│   └── test/                # Testes E2E
│
└── docker-compose.yml       # Configuração Docker
```

---

## 🚀 Instalação

### Pré-requisitos

- Node.js 18+ e npm
- PostgreSQL 15+ (ou Docker)
- Git

### Passo a Passo

1. **Clone o repositório**
```bash
git clone https://github.com/luiznascimentodev/plano-mestre.git
cd plano-mestre
```

2. **Configure o banco de dados**

   **Opção A: Usando Docker (Recomendado)**
   ```bash
   docker-compose up -d
   ```

   **Opção B: PostgreSQL local**
   - Crie um banco de dados PostgreSQL
   - Configure a variável `DATABASE_URL` no arquivo `.env` do backend

3. **Configure o Backend**

   ```bash
   cd backend
   npm install
   
   # Crie o arquivo .env
   cp .env.example .env
   
   # Configure as variáveis de ambiente:
   # DATABASE_URL="postgresql://user:password@localhost:5432/plano_mestre_db"
   # JWT_SECRET="seu-secret-super-seguro-aqui"
   # PORT=3001
   
   # Execute as migrações
   npx prisma migrate dev
   
   # Gere o Prisma Client
   npx prisma generate
   
   # Inicie o servidor
   npm run start:dev
   ```

4. **Configure o Frontend**

   ```bash
   cd ../frontend
   npm install
   
   # Crie o arquivo .env.local
   # NEXT_PUBLIC_API_URL=http://localhost:3001
   
   # Inicie o servidor de desenvolvimento
   npm run dev
   ```

5. **Acesse a aplicação**

   - Frontend: http://localhost:3000
   - Backend API: http://localhost:3001
   - Swagger Docs: http://localhost:3001/api-docs

---

## 📚 Como Usar

### Primeiros Passos

1. **Crie uma conta**
   - Acesse a página de cadastro
   - Preencha seus dados
   - Faça login

2. **Crie seu primeiro assunto**
   - No dashboard, clique em "Novo Assunto"
   - Defina nome, categoria e prioridade
   - Adicione tags para organização

3. **Inicie uma sessão de estudo**
   - Selecione um assunto
   - Clique em "Iniciar Sessão"
   - Use o timer Pomodoro para manter o foco

4. **Crie flashcards**
   - Para cada assunto, crie flashcards
   - Revise regularmente usando o sistema de repetição espaçada

5. **Acompanhe seu progresso**
   - Visualize estatísticas no dashboard
   - Analise seus hábitos de estudo
   - Use os insights para otimizar seu tempo

---

## 🔌 API Endpoints

### Autenticação
```
POST   /auth/register      # Registrar novo usuário
POST   /auth/login         # Fazer login
POST   /auth/refresh       # Renovar access token
GET    /auth/me            # Obter dados do usuário
POST   /auth/logout        # Fazer logout
```

### Assuntos (Topics)
```
GET    /topics             # Listar todos os assuntos
POST   /topics             # Criar novo assunto
GET    /topics/:id         # Obter assunto específico
PATCH  /topics/:id         # Atualizar assunto
DELETE /topics/:id         # Deletar assunto
```

### Sessões de Estudo
```
GET    /study-sessions     # Listar sessões
POST   /study-sessions     # Criar nova sessão
```

### Flashcards
```
GET    /flashcards         # Listar flashcards
POST   /flashcards         # Criar flashcard
GET    /flashcards/:id     # Obter flashcard
PATCH  /flashcards/:id     # Atualizar flashcard
POST   /flashcards/:id/review # Revisar flashcard
DELETE /flashcards/:id     # Deletar flashcard
```

### Hábitos
```
GET    /habits             # Listar hábitos
POST   /habits             # Criar hábito
GET    /habits/:id         # Obter hábito
GET    /habits/:id/stats   # Estatísticas do hábito
PATCH  /habits/:id         # Atualizar hábito
POST   /habits/:id/complete # Completar hábito
DELETE /habits/:id         # Deletar hábito
```

### Analytics
```
POST   /analytics/track    # Registrar evento
GET    /analytics/daily    # Estatísticas diárias
GET    /analytics/weekly   # Estatísticas semanais
GET    /analytics/features # Uso de features
GET    /analytics/engagement # Engajamento
```

📖 **Documentação completa**: Acesse `/api-docs` quando o backend estiver rodando

---

## 🔒 Segurança

O Plano Mestre implementa múltiplas camadas de segurança:

### Autenticação e Autorização
- ✅ JWT tokens com expiração curta (15 minutos)
- ✅ Refresh tokens com expiração longa (7 dias)
- ✅ Tokens armazenados em cookies httpOnly
- ✅ Blacklist de tokens revogados
- ✅ Validação de propriedade de recursos (multilocação)

### Proteção contra Ataques
- ✅ Rate limiting (100 requisições/minuto)
- ✅ Proteção contra força bruta
- ✅ Helmet.js para headers de segurança
- ✅ CORS configurado adequadamente
- ✅ Validação e sanitização de inputs

### Auditoria
- ✅ Log de todas as ações críticas
- ✅ Rastreamento de IP e User-Agent
- ✅ Histórico de login/logout
- ✅ Registro de tentativas falhadas

---

## 🧪 Testes

```bash
# Backend - Testes unitários
cd backend
npm run test

# Backend - Testes E2E
npm run test:e2e

# Backend - Cobertura de testes
npm run test:cov
```

---

## 🏗️ Arquitetura & Design Patterns

### Princípios de Engenharia de Software

- **Clean Architecture**: Separação em camadas (Controller → Service → Repository)
- **SOLID Principles**: Single Responsibility, Open/Closed, Liskov, Interface Segregation, Dependency Inversion
- **DRY (Don't Repeat Yourself)**: Reutilização de código e componentes
- **KISS (Keep It Simple, Stupid)**: Soluções simples e diretas
- **YAGNI (You Aren't Gonna Need It)**: Implementação apenas do necessário

### Padrões de Design Implementados

- **Repository Pattern**: Abstração completa de acesso a dados via Prisma
- **Service Layer**: Lógica de negócio isolada e testável
- **DTO Pattern**: Validação e transformação de dados com class-validator
- **Guard Pattern**: Proteção de rotas com JWT Strategy
- **Strategy Pattern**: Autenticação flexível (JWT, futuramente OAuth)
- **Dependency Injection**: Gerenciamento de dependências via NestJS
- **Module Pattern**: Organização modular por features

---

## 📈 Roadmap & Melhorias Futuras

### Próximas Implementações

- [ ] **Integração com Calendários**: Google Calendar, Outlook (iCal)
- [ ] **PWA & Offline**: Service Workers, IndexedDB, sincronização
- [ ] **Mobile App**: React Native (iOS/Android)
- [ ] **Gamificação**: Sistema de badges, conquistas, leaderboards
- [ ] **Colaboração**: Compartilhamento de flashcards, grupos de estudo
- [ ] **IA & Machine Learning**: Sugestões inteligentes, análise preditiva
- [ ] **Exportação**: PDF reports, CSV data export
- [ ] **Temas Avançados**: Customização completa de UI/UX
- [ ] **Notificações**: Push notifications, email reminders
- [ ] **Multi-idioma**: i18n (Internacionalização)

### Melhorias Técnicas

- [ ] **CI/CD Pipeline**: GitHub Actions, testes automatizados
- [ ] **Monitoring**: Sentry, LogRocket, métricas de performance
- [ ] **Cache Strategy**: Redis para sessões e dados frequentes
- [ ] **Microservices**: Separação de serviços (quando necessário)
- [ ] **GraphQL API**: Alternativa REST para queries complexas

---

## 🤝 Contribuindo

Contribuições são sempre bem-vindas! Siga estes passos:

1. Fork o projeto
2. Crie uma branch para sua feature (`git checkout -b feature/AmazingFeature`)
3. Commit suas mudanças (`git commit -m 'Add some AmazingFeature'`)
4. Push para a branch (`git push origin feature/AmazingFeature`)
5. Abra um Pull Request

### Padrões de Código

- Siga os princípios SOLID
- Escreva testes para novas funcionalidades
- Mantenha a cobertura de testes acima de 80%
- Documente funções complexas
- Use commits semânticos

---

## 📊 Métricas do Projeto

- 📦 **133 arquivos** de código fonte
- 💻 **36.138+ linhas** de código TypeScript
- 🏗️ **8 módulos** principais no backend
- 🎨 **15+ componentes** React reutilizáveis
- 🔐 **6 camadas** de segurança implementadas
- 📚 **12 migrações** de banco de dados
- 🧪 **Cobertura de testes** em expansão

## 📝 Licença

Este projeto está sob a licença MIT. Veja o arquivo [LICENSE](LICENSE) para mais detalhes.

---

## 🎯 Por que este projeto se destaca?

### Para Recrutadores e Tech Leads

✅ **Stack Moderna**: Next.js 16, NestJS 11, TypeScript, Prisma - tecnologias em alta demanda  
✅ **Arquitetura Sólida**: Clean Architecture, SOLID, Design Patterns - código profissional  
✅ **Segurança**: JWT, Rate Limiting, Audit Logs - pronta para produção  
✅ **Escalabilidade**: Modular, testável, documentado - fácil manutenção  
✅ **Boas Práticas**: TypeScript, ESLint, Prettier, Conventional Commits  
✅ **Full-Stack**: Demonstra proficiência em frontend e backend  
✅ **Projeto Real**: Solução completa, não apenas tutoriais

---

## 👨‍💻 Autor

**Luiz Nascimento** - Full Stack Developer

Desenvolvedor apaixonado por criar soluções escaláveis e de alta qualidade, com foco em arquitetura limpa, segurança e experiência do usuário.

- 🌐 **GitHub**: [@luiznascimentodev](https://github.com/luiznascimentodev)
- 💼 **LinkedIn**: [Conecte-se comigo](https://linkedin.com/in/luiznascimentodev)
- 📧 **Email**: luiznascdev@gmail.com
- 🚀 **Portfólio**: [Em breve]

### 💡 Destaques Técnicos

- ✅ **36.138+ linhas de código** TypeScript
- ✅ **133 arquivos** organizados seguindo Clean Architecture
- ✅ **100% Type-Safe** (TypeScript em todo o stack)
- ✅ **Segurança Enterprise**: JWT, Rate Limiting, Audit Logs
- ✅ **Testes Automatizados**: Unit, Integration, E2E
- ✅ **Documentação Completa**: Swagger/OpenAPI

---

## 🙏 Agradecimentos

- Comunidade NestJS
- Comunidade Next.js
- Todos os contribuidores de código aberto
- Estudantes que testam e fornecem feedback

---

<div align="center">

**Feito com ❤️ e muito ☕**

⭐ Se este projeto foi útil para você, considere dar uma estrela!

[⬆ Voltar ao topo](#-plano-mestre)

</div>


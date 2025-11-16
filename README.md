<div align="center">

# 📚 Plano Mestre

**Plataforma full-stack de gerenciamento de estudos com arquitetura escalável**



<!-- PROJECT_TECH_START -->
[![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?style=for-the-badge&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Next.js](https://img.shields.io/badge/Next.js-000000?style=for-the-badge&logo=next.js&logoColor=white)](https://nextjs.org/)
[![NestJS](https://img.shields.io/badge/NestJS-E0234E?style=for-the-badge&logo=nestjs&logoColor=white)](https://nestjs.com/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-316192?style=for-the-badge&logo=postgresql&logoColor=white)](https://www.postgresql.org/)
[![Prisma](https://img.shields.io/badge/Prisma-2D3748?style=for-the-badge&logo=prisma&logoColor=white)](https://www.prisma.io/)
<!-- PROJECT_TECH_END -->
</div>

---

<!-- PROJECT_TAG_START -->

## 🌟 Projeto em Destaque
<!-- PROJECT_TITLE_START -->
📚 Plano Mestre
<!-- PROJECT_TITLE_END -->
O Plano Mestre é uma plataforma de gerenciamento de estudos full-stack e pronta para produção, projetada para otimizar o aprendizado com ferramentas científicas. O projeto integra um timer Pomodoro, flashcards com repetição espaçada (Spaced Repetition) e um dashboard de analytics em tempo real, tudo construído sobre uma stack moderna com NestJS (backend) e Next.js (frontend). Este repositório demonstra uma aplicação robusta de Clean Architecture, princípios SOLID e práticas de segurança de nível enterprise, incluindo autenticação JWT com refresh tokens e logs de auditoria.
<!-- PROJECT_TAG_END -->


<!-- PROJECT_HIGHLIGHTS_START -->
- ✅ Clean Architecture + SOLID principles
- ✅ Autenticação JWT com refresh tokens
- ✅ Testes E2E completos
- ✅ Documentação Swagger/OpenAPI
- ✅ 36.138+ linhas de código TypeScript
<!-- PROJECT_HIGHLIGHTS_END -->



## ✨ Funcionalidades

- **Gestão de Assuntos**: Organização por prioridade, categoria, tags e status
- **Sessões de Estudo**: Timer Pomodoro integrado com registro automático
- **Flashcards Inteligentes**: Sistema de repetição espaçada com dificuldade adaptativa
- **Planejamento**: Agendamento de sessões com calendário visual
- **Hábitos**: Acompanhamento de streaks e estatísticas de completação
- **Analytics**: Dashboard com métricas em tempo real e insights de produtividade

---

## 🛠️ Stack Tecnológica

### Frontend
- Next.js 16 (App Router, Server Components)
- TypeScript (100% tipado)
- Tailwind CSS 4
- Zustand (State Management)
- Axios (HTTP Client)

### Backend
- NestJS 11 (Modular, Dependency Injection)
- Prisma 6 (ORM type-safe)
- PostgreSQL 15
- JWT + Refresh Tokens (httpOnly cookies)
- Swagger/OpenAPI
- Helmet, Rate Limiting, Audit Logs

### DevOps & Qualidade
- Docker & Docker Compose
- Jest, Supertest (Unit, Integration, E2E)
- ESLint, Prettier
- Conventional Commits

---


## 📁 Estrutura do Projeto

```
plano-mestre/
├── frontend/              # Next.js App Router
│   ├── src/
│   │   ├── app/          # Rotas e páginas
│   │   ├── components/   # Componentes React
│   │   ├── lib/          # Utilitários
│   │   └── store/        # Zustand stores
│
├── backend/              # NestJS API
│   ├── src/
│   │   ├── auth/         # Autenticação
│   │   ├── topics/       # Gestão de assuntos
│   │   ├── study-sessions/
│   │   ├── flashcards/
│   │   ├── habits/
│   │   ├── analytics/
│   │   ├── scheduled-sessions/
│   │   └── audit/        # Auditoria
│   ├── prisma/           # Schema e migrações
│   └── test/             # Testes E2E
│
└── docker-compose.yml
```

---

## 🚀 Instalação

### Pré-requisitos
- Node.js 18+
- PostgreSQL 15+ (ou Docker)
- Git

### Passo a Passo

1. **Clone o repositório**
```bash
git clone https://github.com/luiznascimentodev/plano-mestre.git
cd plano-mestre
```

2. **Configure o banco de dados**
```bash
# Opção A: Docker (Recomendado)
docker-compose up -d

# Opção B: PostgreSQL local
# Configure DATABASE_URL no .env do backend
```

3. **Backend**
```bash
cd backend
npm install
cp .env.example .env
# Configure: DATABASE_URL, JWT_SECRET, PORT
npx prisma migrate dev
npx prisma generate
npm run start:dev
```

4. **Frontend**
```bash
cd ../frontend
npm install
# Configure: NEXT_PUBLIC_API_URL=http://localhost:3001
npm run dev
```

5. **Acesse**
- Frontend: http://localhost:3000
- API: http://localhost:3001
- Swagger: http://localhost:3001/api-docs

---

## 🔌 API Endpoints

### Autenticação
```
POST   /auth/register      POST   /auth/login
POST   /auth/refresh       GET    /auth/me
POST   /auth/logout
```

### Recursos
```
GET    /topics             POST   /topics
GET    /topics/:id         PATCH  /topics/:id
DELETE /topics/:id

GET    /study-sessions     POST   /study-sessions
GET    /flashcards         POST   /flashcards
POST   /flashcards/:id/review
GET    /habits             POST   /habits
POST   /habits/:id/complete
GET    /analytics/daily    GET    /analytics/weekly
```

📖 **Documentação completa**: `/api-docs` (Swagger)

---

## 🔒 Segurança

- **Autenticação**: JWT (15min) + Refresh Tokens (7 dias) em cookies httpOnly
- **Proteção**: Rate limiting (100 req/min), Helmet.js, CORS, validação de inputs
- **Auditoria**: Log completo de ações críticas, rastreamento de IP/User-Agent
- **Multilocação**: Validação de propriedade de recursos em todas as rotas

---

## 🧪 Testes

```bash
cd backend
npm run test          # Unit tests
npm run test:e2e      # E2E tests
npm run test:cov      # Coverage
```

**Cobertura**: 11 arquivos de testes E2E cobrindo todos os módulos (Auth, Topics, Study Sessions, Flashcards, Habits, Analytics, etc.)

---

## 🏗️ Arquitetura

### Princípios
- **Clean Architecture**: Separação em camadas (Controller → Service → Repository)
- **SOLID**: Single Responsibility, Open/Closed, Liskov, Interface Segregation, Dependency Inversion
- **DRY, KISS, YAGNI**: Reutilização, simplicidade, implementação apenas do necessário

### Padrões Implementados
- Repository Pattern, Service Layer, DTO Pattern
- Guard Pattern (JWT Strategy), Strategy Pattern
- Dependency Injection (NestJS), Module Pattern

---

## 📊 Métricas

- **36.138+ linhas** de código TypeScript
- **133 arquivos** organizados seguindo Clean Architecture
- **8 módulos** principais no backend
- **11 arquivos** de testes E2E
- **100% Type-Safe** (TypeScript em todo o stack)
- **12 migrações** de banco de dados

---

## 🎯 Destaques Técnicos

✅ Stack moderna (Next.js 16, NestJS 11, TypeScript, Prisma)  
✅ Arquitetura sólida (Clean Architecture, SOLID, Design Patterns)  
✅ Segurança enterprise (JWT, Rate Limiting, Audit Logs)  
✅ Testes automatizados (Unit, Integration, E2E)  
✅ Documentação completa (Swagger/OpenAPI)  
✅ Código production-ready

---

## 📈 Roadmap

- [ ] Integração com Calendários (Google Calendar, Outlook)
- [ ] PWA & Offline (Service Workers, IndexedDB)
- [ ] Mobile App (React Native)
- [ ] Gamificação (badges, conquistas, leaderboards)
- [ ] IA & Machine Learning (sugestões inteligentes)
- [ ] CI/CD Pipeline (GitHub Actions)
- [ ] Monitoring (Sentry, LogRocket)
- [ ] Cache Strategy (Redis)

---

## 🤝 Contribuindo

1. Fork o projeto
2. Crie uma branch (`git checkout -b feature/AmazingFeature`)
3. Commit suas mudanças (`git commit -m 'Add some AmazingFeature'`)
4. Push para a branch (`git push origin feature/AmazingFeature`)
5. Abra um Pull Request

**Padrões**: SOLID, testes para novas funcionalidades, commits semânticos, documentação de funções complexas.

---

## 📝 Licença

Este projeto está sob a licença MIT. Veja o arquivo [LICENSE](LICENSE) para mais detalhes.

---

## 👨‍💻 Autor

**Luiz Nascimento** - Full Stack Developer

Desenvolvedor apaixonado por criar soluções escaláveis e de alta qualidade, com foco em arquitetura limpa, segurança e experiência do usuário.

- 🌐 **GitHub**: [@luiznascimentodev](https://github.com/luiznascimentodev)
- 💼 **LinkedIn**: [Conecte-se comigo](https://www.linkedin.com/in/luiz-felippe-nascimento/)
- 📧 **Email**: luiznascdev@gmail.com

---

<div align="center">

⭐ Se este projeto foi útil para você, considere dar uma estrela!

[⬆ Voltar ao topo](#-plano-mestre)

</div>

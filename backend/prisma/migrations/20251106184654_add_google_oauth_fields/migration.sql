-- AlterTable: Adicionar campos para suporte a Google OAuth
-- Torna password opcional (nullable)
-- Adiciona googleId, provider e avatarUrl

-- Primeiro, tornar password opcional (nullable)
-- Nota: Se houver dados, isso pode falhar se houver valores NULL
-- Nesse caso, você precisará atualizar os dados primeiro
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'User' AND column_name = 'password' AND is_nullable = 'NO'
  ) THEN
    ALTER TABLE "User" ALTER COLUMN "password" DROP NOT NULL;
  END IF;
END $$;

-- Adicionar campo googleId (opcional, único)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'User' AND column_name = 'googleId'
  ) THEN
    ALTER TABLE "User" ADD COLUMN "googleId" TEXT;
  END IF;
END $$;

-- Criar índice único para googleId (apenas se não existir)
CREATE UNIQUE INDEX IF NOT EXISTS "User_googleId_key" ON "User"("googleId") WHERE "googleId" IS NOT NULL;

-- Adicionar campo provider (opcional)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'User' AND column_name = 'provider'
  ) THEN
    ALTER TABLE "User" ADD COLUMN "provider" TEXT;
  END IF;
END $$;

-- Adicionar campo avatarUrl (opcional)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'User' AND column_name = 'avatarUrl'
  ) THEN
    ALTER TABLE "User" ADD COLUMN "avatarUrl" TEXT;
  END IF;
END $$;

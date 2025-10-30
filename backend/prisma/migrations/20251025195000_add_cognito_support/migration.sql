-- AlterTable
ALTER TABLE "Usuario"
  ALTER COLUMN "contrasena" DROP NOT NULL;

-- AddColumn
ALTER TABLE "Usuario"
  ADD COLUMN "cognitoSub" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "Usuario_cognitoSub_key" ON "Usuario"("cognitoSub") WHERE "cognitoSub" IS NOT NULL;

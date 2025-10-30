/*
  Warnings:

  - You are about to drop the column `metodo` on the `TransaccionPago` table. All the data in the column will be lost.
  - You are about to drop the column `referencia` on the `TransaccionPago` table. All the data in the column will be lost.
  - Added the required column `actualizadoEn` to the `TransaccionPago` table without a default value. This is not possible if the table is not empty.
  - Added the required column `metodoPago` to the `TransaccionPago` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "public"."TransaccionPago" DROP CONSTRAINT "TransaccionPago_pedidoId_fkey";

-- AlterTable
ALTER TABLE "public"."Notificacion" ADD COLUMN     "datosAdicionales" JSONB;

-- AlterTable
ALTER TABLE "public"."Pedido" ADD COLUMN     "repartidorId" INTEGER;

-- AlterTable
ALTER TABLE "public"."TransaccionPago" DROP COLUMN "metodo",
DROP COLUMN "referencia",
ADD COLUMN     "actualizadoEn" TIMESTAMP(3) NOT NULL,
ADD COLUMN     "datosAdicionales" JSONB,
ADD COLUMN     "metodoPago" "public"."MetodoPago" NOT NULL,
ADD COLUMN     "referenciaExterna" TEXT;

-- AlterTable
ALTER TABLE "public"."Usuario" ADD COLUMN     "activo" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "telefono" TEXT;

-- AddForeignKey
ALTER TABLE "public"."Pedido" ADD CONSTRAINT "Pedido_repartidorId_fkey" FOREIGN KEY ("repartidorId") REFERENCES "public"."Usuario"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."TransaccionPago" ADD CONSTRAINT "TransaccionPago_pedidoId_fkey" FOREIGN KEY ("pedidoId") REFERENCES "public"."Pedido"("id") ON DELETE CASCADE ON UPDATE CASCADE;

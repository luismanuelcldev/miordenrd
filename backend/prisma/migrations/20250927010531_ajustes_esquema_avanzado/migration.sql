/*
  Warnings:

  - Added the required column `estado` to the `Notificacion` table without a default value. This is not possible if the table is not empty.
  - Added the required column `tipo` to the `Notificacion` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "public"."Notificacion" ADD COLUMN     "estado" TEXT NOT NULL,
ADD COLUMN     "tipo" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "public"."ReporteVenta" ADD COLUMN     "filtroCategoriaId" INTEGER,
ADD COLUMN     "filtroFechaFin" TIMESTAMP(3),
ADD COLUMN     "filtroFechaInicio" TIMESTAMP(3),
ADD COLUMN     "filtroUsuarioId" INTEGER;

-- CreateTable
CREATE TABLE "public"."TransaccionPago" (
    "id" SERIAL NOT NULL,
    "pedidoId" INTEGER NOT NULL,
    "metodo" TEXT NOT NULL,
    "referencia" TEXT,
    "monto" DOUBLE PRECISION NOT NULL,
    "estado" TEXT NOT NULL,
    "creadoEn" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "TransaccionPago_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."AuditoriaAccion" (
    "id" SERIAL NOT NULL,
    "usuarioId" INTEGER NOT NULL,
    "modulo" TEXT NOT NULL,
    "accion" TEXT NOT NULL,
    "descripcion" TEXT,
    "fecha" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AuditoriaAccion_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "public"."TransaccionPago" ADD CONSTRAINT "TransaccionPago_pedidoId_fkey" FOREIGN KEY ("pedidoId") REFERENCES "public"."Pedido"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."AuditoriaAccion" ADD CONSTRAINT "AuditoriaAccion_usuarioId_fkey" FOREIGN KEY ("usuarioId") REFERENCES "public"."Usuario"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

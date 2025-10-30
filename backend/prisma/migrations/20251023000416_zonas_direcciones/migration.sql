-- AlterTable
ALTER TABLE "public"."Direccion" ADD COLUMN     "latitud" DOUBLE PRECISION,
ADD COLUMN     "longitud" DOUBLE PRECISION,
ADD COLUMN     "referencias" TEXT,
ADD COLUMN     "validada" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "zonaId" INTEGER;

-- CreateTable
CREATE TABLE "public"."ZonaEntrega" (
    "id" SERIAL NOT NULL,
    "nombre" TEXT NOT NULL,
    "descripcion" TEXT,
    "color" TEXT,
    "activa" BOOLEAN NOT NULL DEFAULT true,
    "poligono" JSONB NOT NULL,
    "centroideLatitud" DOUBLE PRECISION,
    "centroideLongitud" DOUBLE PRECISION,
    "radioCoberturaKm" DOUBLE PRECISION,
    "creadoEn" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "actualizadoEn" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ZonaEntrega_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."TarifaZona" (
    "id" SERIAL NOT NULL,
    "zonaId" INTEGER NOT NULL,
    "distanciaMin" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "distanciaMax" DOUBLE PRECISION,
    "costoBase" DOUBLE PRECISION NOT NULL,
    "costoPorKm" DOUBLE PRECISION,
    "recargo" DOUBLE PRECISION DEFAULT 0,
    "creadoEn" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "actualizadoEn" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TarifaZona_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Contacto" (
    "id" SERIAL NOT NULL,
    "nombre" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "asunto" TEXT,
    "mensaje" TEXT NOT NULL,
    "creadoEn" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Contacto_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "ZonaEntrega_nombre_key" ON "public"."ZonaEntrega"("nombre");

-- AddForeignKey
ALTER TABLE "public"."Direccion" ADD CONSTRAINT "Direccion_zonaId_fkey" FOREIGN KEY ("zonaId") REFERENCES "public"."ZonaEntrega"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."TarifaZona" ADD CONSTRAINT "TarifaZona_zonaId_fkey" FOREIGN KEY ("zonaId") REFERENCES "public"."ZonaEntrega"("id") ON DELETE CASCADE ON UPDATE CASCADE;

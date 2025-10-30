-- CreateTable
CREATE TABLE "ConfiguracionSistema" (
    "id" SERIAL NOT NULL,
    "nombreTienda" TEXT NOT NULL,
    "descripcion" TEXT,
    "email" TEXT NOT NULL,
    "telefono" TEXT,
    "direccion" TEXT,
    "notificacionesPedidos" BOOLEAN NOT NULL DEFAULT true,
    "notificacionesStock" BOOLEAN NOT NULL DEFAULT true,
    "notificacionesClientes" BOOLEAN NOT NULL DEFAULT false,
    "autenticacionDosFactor" BOOLEAN NOT NULL DEFAULT false,
    "sesionExpiracion" INTEGER NOT NULL DEFAULT 24,
    "envioGratis" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "costoEnvio" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "tiempoEntrega" TEXT,
    "iva" INTEGER NOT NULL DEFAULT 0,
    "moneda" TEXT NOT NULL DEFAULT 'RD$',
    "colorPrimario" TEXT NOT NULL DEFAULT '#2b62e1',
    "colorSecundario" TEXT NOT NULL DEFAULT '#1f2937',
    "logoUrl" TEXT,
    "creadoEn" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "actualizadoEn" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ConfiguracionSistema_pkey" PRIMARY KEY ("id")
);

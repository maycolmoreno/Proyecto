-- CreateEnum
CREATE TYPE "urgencia" AS ENUM ('BAJA', 'MEDIA', 'ALTA');

-- CreateEnum
CREATE TYPE "estado_solicitud" AS ENUM ('ABIERTA', 'EN_REVISION', 'ACEPTADA_POR_DONANTE', 'EN_ENTREGA', 'ATENDIDA', 'CANCELADA');

-- CreateEnum
CREATE TYPE "estado_oferta" AS ENUM ('PENDIENTE', 'ACEPTADA', 'RECHAZADA');

-- CreateEnum
CREATE TYPE "tipo_operacion_entrega" AS ENUM ('DONACION', 'TRUEQUE');

-- CreateEnum
CREATE TYPE "modalidad_entrega" AS ENUM ('RETIRO_DOMICILIO', 'ENTREGA_DIRECTA', 'PUNTO_ENCUENTRO');

-- CreateEnum
CREATE TYPE "estado_entrega" AS ENUM ('PROGRAMADA', 'CONFIRMADA', 'CANCELADA');

-- CreateTable
CREATE TABLE "solicitudes" (
    "id_solicitud" UUID NOT NULL,
    "id_beneficiario" UUID NOT NULL,
    "id_categoria" UUID NOT NULL,
    "titulo" VARCHAR(150) NOT NULL,
    "descripcion" TEXT NOT NULL,
    "urgencia" "urgencia" NOT NULL,
    "estado_solicitud" "estado_solicitud" NOT NULL DEFAULT 'ABIERTA',
    "id_ubicacion" UUID NOT NULL,
    "evidencia_url" VARCHAR(500),
    "fecha" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "solicitudes_pkey" PRIMARY KEY ("id_solicitud")
);

-- CreateTable
CREATE TABLE "ofertas_solicitud" (
    "id_oferta" UUID NOT NULL,
    "id_solicitud" UUID NOT NULL,
    "id_donante" UUID NOT NULL,
    "id_donacion" UUID NOT NULL,
    "mensaje" TEXT,
    "estado" "estado_oferta" NOT NULL DEFAULT 'PENDIENTE',
    "fecha" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ofertas_solicitud_pkey" PRIMARY KEY ("id_oferta")
);

-- CreateTable
CREATE TABLE "entregas" (
    "id_entrega" UUID NOT NULL,
    "tipo_operacion" "tipo_operacion_entrega" NOT NULL,
    "id_referencia" UUID NOT NULL,
    "modalidad" "modalidad_entrega" NOT NULL,
    "estado" "estado_entrega" NOT NULL DEFAULT 'PROGRAMADA',
    "fecha_programada" TIMESTAMPTZ,

    CONSTRAINT "entregas_pkey" PRIMARY KEY ("id_entrega")
);

-- CreateIndex
CREATE INDEX "solicitudes_estado_solicitud_idx" ON "solicitudes"("estado_solicitud");

-- CreateIndex
CREATE INDEX "solicitudes_id_categoria_idx" ON "solicitudes"("id_categoria");

-- CreateIndex
CREATE INDEX "solicitudes_urgencia_idx" ON "solicitudes"("urgencia");

-- CreateIndex
CREATE INDEX "solicitudes_fecha_idx" ON "solicitudes"("fecha" DESC);

-- CreateIndex
CREATE INDEX "ofertas_solicitud_id_solicitud_idx" ON "ofertas_solicitud"("id_solicitud");

-- CreateIndex
CREATE INDEX "entregas_tipo_operacion_id_referencia_idx" ON "entregas"("tipo_operacion", "id_referencia");

-- CreateIndex
CREATE INDEX "entregas_estado_idx" ON "entregas"("estado");

-- AddForeignKey
ALTER TABLE "solicitudes" ADD CONSTRAINT "solicitudes_id_beneficiario_fkey" FOREIGN KEY ("id_beneficiario") REFERENCES "usuarios"("id_usuario") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "solicitudes" ADD CONSTRAINT "solicitudes_id_categoria_fkey" FOREIGN KEY ("id_categoria") REFERENCES "categorias"("id_categoria") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "solicitudes" ADD CONSTRAINT "solicitudes_id_ubicacion_fkey" FOREIGN KEY ("id_ubicacion") REFERENCES "ubicaciones"("id_ubicacion") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ofertas_solicitud" ADD CONSTRAINT "ofertas_solicitud_id_solicitud_fkey" FOREIGN KEY ("id_solicitud") REFERENCES "solicitudes"("id_solicitud") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ofertas_solicitud" ADD CONSTRAINT "ofertas_solicitud_id_donante_fkey" FOREIGN KEY ("id_donante") REFERENCES "usuarios"("id_usuario") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ofertas_solicitud" ADD CONSTRAINT "ofertas_solicitud_id_donacion_fkey" FOREIGN KEY ("id_donacion") REFERENCES "donaciones"("id_donacion") ON DELETE RESTRICT ON UPDATE CASCADE;

-- UniqueIndex parcial (ADR-011, Fase 3 sección 3) — no expresable en schema.prisma.
-- Invariante: una Solicitud solo puede tener una Oferta ACEPTADA a la vez.
CREATE UNIQUE INDEX "uq_oferta_activa_por_solicitud" ON "ofertas_solicitud"("id_solicitud") WHERE "estado" = 'ACEPTADA';

-- CreateEnum
CREATE TYPE "estado_trueque" AS ENUM ('PUBLICADO', 'PROPUESTA_RECIBIDA', 'ACEPTADO', 'EN_COORDINACION', 'INTERCAMBIADO', 'CANCELADO');

-- CreateEnum
CREATE TYPE "estado_propuesta" AS ENUM ('PENDIENTE', 'ACEPTADA', 'RECHAZADA');

-- CreateTable
CREATE TABLE "trueques" (
    "id_trueque" UUID NOT NULL,
    "id_usuario" UUID NOT NULL,
    "id_categoria" UUID NOT NULL,
    "titulo" VARCHAR(150) NOT NULL,
    "descripcion" TEXT NOT NULL,
    "estado_objeto" "estado_objeto" NOT NULL,
    "estado_trueque" "estado_trueque" NOT NULL DEFAULT 'PUBLICADO',
    "fecha" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "trueques_pkey" PRIMARY KEY ("id_trueque")
);

-- CreateTable
CREATE TABLE "propuestas_trueque" (
    "id_propuesta" UUID NOT NULL,
    "id_trueque_origen" UUID NOT NULL,
    "id_trueque_ofrecido" UUID NOT NULL,
    "id_usuario_proponente" UUID NOT NULL,
    "estado" "estado_propuesta" NOT NULL DEFAULT 'PENDIENTE',
    "fecha" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "propuestas_trueque_pkey" PRIMARY KEY ("id_propuesta")
);

-- CreateIndex
CREATE INDEX "trueques_estado_trueque_idx" ON "trueques"("estado_trueque");

-- CreateIndex
CREATE INDEX "trueques_id_categoria_idx" ON "trueques"("id_categoria");

-- CreateIndex
CREATE INDEX "trueques_fecha_idx" ON "trueques"("fecha" DESC);

-- CreateIndex
CREATE INDEX "propuestas_trueque_id_trueque_origen_idx" ON "propuestas_trueque"("id_trueque_origen");

-- AddForeignKey
ALTER TABLE "trueques" ADD CONSTRAINT "trueques_id_usuario_fkey" FOREIGN KEY ("id_usuario") REFERENCES "usuarios"("id_usuario") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "trueques" ADD CONSTRAINT "trueques_id_categoria_fkey" FOREIGN KEY ("id_categoria") REFERENCES "categorias"("id_categoria") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "propuestas_trueque" ADD CONSTRAINT "propuestas_trueque_id_trueque_origen_fkey" FOREIGN KEY ("id_trueque_origen") REFERENCES "trueques"("id_trueque") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "propuestas_trueque" ADD CONSTRAINT "propuestas_trueque_id_trueque_ofrecido_fkey" FOREIGN KEY ("id_trueque_ofrecido") REFERENCES "trueques"("id_trueque") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "propuestas_trueque" ADD CONSTRAINT "propuestas_trueque_id_usuario_proponente_fkey" FOREIGN KEY ("id_usuario_proponente") REFERENCES "usuarios"("id_usuario") ON DELETE RESTRICT ON UPDATE CASCADE;

-- CheckConstraint (Fase 3): no se puede proponer un trueque contra sí mismo.
ALTER TABLE "propuestas_trueque" ADD CONSTRAINT "chk_propuesta_origen_distinto_ofrecido"
    CHECK ("id_trueque_origen" <> "id_trueque_ofrecido");

-- UniqueIndex parcial (ADR-011, Fase 3 sección 3) — no expresable en schema.prisma.
-- Invariante: un Trueque (como origen) solo puede tener una Propuesta ACEPTADA a la vez.
CREATE UNIQUE INDEX "uq_propuesta_activa_por_trueque" ON "propuestas_trueque"("id_trueque_origen") WHERE "estado" = 'ACEPTADA';

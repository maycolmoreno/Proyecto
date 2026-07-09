-- CreateEnum
CREATE TYPE "estado_categoria" AS ENUM ('ACTIVA', 'INACTIVA');

-- CreateEnum
CREATE TYPE "estado_objeto" AS ENUM ('NUEVO', 'BUEN_ESTADO', 'USADO', 'REQUIERE_REPARACION');

-- CreateEnum
CREATE TYPE "estado_donacion" AS ENUM ('PUBLICADA', 'SOLICITADA', 'APROBADA', 'EN_RETIRO', 'ENTREGADA', 'CANCELADA');

-- CreateEnum
CREATE TYPE "tipo_entidad_imagen" AS ENUM ('DONACION', 'SOLICITUD', 'TRUEQUE');

-- CreateTable
CREATE TABLE "categorias" (
    "id_categoria" UUID NOT NULL,
    "nombre" VARCHAR(100) NOT NULL,
    "tipo" VARCHAR(50) NOT NULL,
    "estado" "estado_categoria" NOT NULL DEFAULT 'ACTIVA',

    CONSTRAINT "categorias_pkey" PRIMARY KEY ("id_categoria")
);

-- CreateTable
CREATE TABLE "donaciones" (
    "id_donacion" UUID NOT NULL,
    "id_donante" UUID NOT NULL,
    "id_categoria" UUID NOT NULL,
    "titulo" VARCHAR(150) NOT NULL,
    "descripcion" TEXT NOT NULL,
    "estado_objeto" "estado_objeto" NOT NULL,
    "estado_donacion" "estado_donacion" NOT NULL DEFAULT 'PUBLICADA',
    "requiere_retiro" BOOLEAN NOT NULL DEFAULT false,
    "id_ubicacion_retiro" UUID,
    "fecha" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "donaciones_pkey" PRIMARY KEY ("id_donacion")
);

-- CreateTable
CREATE TABLE "imagenes" (
    "id_imagen" UUID NOT NULL,
    "tipo_entidad" "tipo_entidad_imagen" NOT NULL,
    "id_entidad" UUID NOT NULL,
    "url" VARCHAR(500) NOT NULL,
    "public_id" VARCHAR(255) NOT NULL,
    "fecha" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "imagenes_pkey" PRIMARY KEY ("id_imagen")
);

-- CreateIndex
CREATE UNIQUE INDEX "categorias_nombre_tipo_key" ON "categorias"("nombre", "tipo");

-- CreateIndex
CREATE INDEX "donaciones_estado_donacion_idx" ON "donaciones"("estado_donacion");

-- CreateIndex
CREATE INDEX "donaciones_id_categoria_idx" ON "donaciones"("id_categoria");

-- CreateIndex
CREATE INDEX "donaciones_id_donante_idx" ON "donaciones"("id_donante");

-- CreateIndex
CREATE INDEX "donaciones_fecha_idx" ON "donaciones"("fecha" DESC);

-- CreateIndex
CREATE INDEX "imagenes_tipo_entidad_id_entidad_idx" ON "imagenes"("tipo_entidad", "id_entidad");

-- AddForeignKey
ALTER TABLE "donaciones" ADD CONSTRAINT "donaciones_id_donante_fkey" FOREIGN KEY ("id_donante") REFERENCES "usuarios"("id_usuario") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "donaciones" ADD CONSTRAINT "donaciones_id_categoria_fkey" FOREIGN KEY ("id_categoria") REFERENCES "categorias"("id_categoria") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "donaciones" ADD CONSTRAINT "donaciones_id_ubicacion_retiro_fkey" FOREIGN KEY ("id_ubicacion_retiro") REFERENCES "ubicaciones"("id_ubicacion") ON DELETE SET NULL ON UPDATE CASCADE;

-- CheckConstraint (Fase 3, regla de negocio #5 — ADR aplicado a nivel de BD, no expresable en schema.prisma)
ALTER TABLE "donaciones" ADD CONSTRAINT "chk_donacion_ubicacion_retiro"
    CHECK (("requiere_retiro" = false) OR ("id_ubicacion_retiro" IS NOT NULL));

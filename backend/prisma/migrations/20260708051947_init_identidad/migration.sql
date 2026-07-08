-- CreateEnum
CREATE TYPE "rol" AS ENUM ('ADMINISTRADOR', 'DONANTE', 'BENEFICIARIO', 'USUARIO_COMUNIDAD');

-- CreateEnum
CREATE TYPE "estado_usuario" AS ENUM ('ACTIVO', 'SUSPENDIDO', 'ELIMINADO');

-- CreateEnum
CREATE TYPE "tipo_ubicacion" AS ENUM ('ESTABLECIDA', 'RETIRO');

-- CreateTable
CREATE TABLE "usuarios" (
    "id_usuario" UUID NOT NULL,
    "nombre" VARCHAR(150) NOT NULL,
    "correo" VARCHAR(255) NOT NULL,
    "password_hash" VARCHAR(255) NOT NULL,
    "telefono" VARCHAR(20),
    "rol" "rol" NOT NULL,
    "estado" "estado_usuario" NOT NULL DEFAULT 'ACTIVO',
    "fecha_creacion" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "usuarios_pkey" PRIMARY KEY ("id_usuario")
);

-- CreateTable
CREATE TABLE "ubicaciones" (
    "id_ubicacion" UUID NOT NULL,
    "id_usuario" UUID NOT NULL,
    "provincia" VARCHAR(100) NOT NULL,
    "ciudad" VARCHAR(100) NOT NULL,
    "sector" VARCHAR(150),
    "referencia" VARCHAR(255),
    "latitud" DECIMAL(9,6),
    "longitud" DECIMAL(9,6),
    "tipo" "tipo_ubicacion" NOT NULL,

    CONSTRAINT "ubicaciones_pkey" PRIMARY KEY ("id_ubicacion")
);

-- CreateIndex
CREATE UNIQUE INDEX "usuarios_correo_key" ON "usuarios"("correo");

-- CreateIndex
CREATE INDEX "usuarios_rol_idx" ON "usuarios"("rol");

-- CreateIndex
CREATE INDEX "ubicaciones_id_usuario_tipo_idx" ON "ubicaciones"("id_usuario", "tipo");

-- CreateIndex
CREATE INDEX "ubicaciones_provincia_ciudad_idx" ON "ubicaciones"("provincia", "ciudad");

-- AddForeignKey
ALTER TABLE "ubicaciones" ADD CONSTRAINT "ubicaciones_id_usuario_fkey" FOREIGN KEY ("id_usuario") REFERENCES "usuarios"("id_usuario") ON DELETE CASCADE ON UPDATE CASCADE;

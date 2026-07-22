-- CreateEnum
CREATE TYPE "estado_reserva" AS ENUM ('PENDIENTE', 'ACEPTADA', 'RECHAZADA');

-- AlterTable
ALTER TABLE "donaciones" ADD COLUMN     "items_incluidos" TEXT[] DEFAULT ARRAY[]::TEXT[];

-- CreateTable
CREATE TABLE "reservas_donacion" (
    "id_reserva" UUID NOT NULL,
    "id_donacion" UUID NOT NULL,
    "id_usuario_interesado" UUID NOT NULL,
    "mensaje" TEXT,
    "estado" "estado_reserva" NOT NULL DEFAULT 'PENDIENTE',
    "fecha" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "reservas_donacion_pkey" PRIMARY KEY ("id_reserva")
);

-- CreateIndex
CREATE INDEX "reservas_donacion_id_donacion_idx" ON "reservas_donacion"("id_donacion");

-- AddForeignKey
ALTER TABLE "reservas_donacion" ADD CONSTRAINT "reservas_donacion_id_donacion_fkey" FOREIGN KEY ("id_donacion") REFERENCES "donaciones"("id_donacion") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "reservas_donacion" ADD CONSTRAINT "reservas_donacion_id_usuario_interesado_fkey" FOREIGN KEY ("id_usuario_interesado") REFERENCES "usuarios"("id_usuario") ON DELETE RESTRICT ON UPDATE CASCADE;

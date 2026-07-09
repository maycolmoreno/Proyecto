-- CreateTable
CREATE TABLE "auditoria" (
    "id_auditoria" UUID NOT NULL,
    "id_usuario" UUID,
    "accion" VARCHAR(50) NOT NULL,
    "entidad" VARCHAR(50) NOT NULL,
    "id_entidad" UUID NOT NULL,
    "detalle" JSONB,
    "fecha" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "auditoria_pkey" PRIMARY KEY ("id_auditoria")
);

-- CreateIndex
CREATE INDEX "auditoria_entidad_id_entidad_idx" ON "auditoria"("entidad", "id_entidad");

-- CreateIndex
CREATE INDEX "auditoria_fecha_idx" ON "auditoria"("fecha" DESC);

-- CreateIndex
CREATE INDEX "auditoria_id_usuario_idx" ON "auditoria"("id_usuario");

-- AddForeignKey
ALTER TABLE "auditoria" ADD CONSTRAINT "auditoria_id_usuario_fkey" FOREIGN KEY ("id_usuario") REFERENCES "usuarios"("id_usuario") ON DELETE SET NULL ON UPDATE CASCADE;

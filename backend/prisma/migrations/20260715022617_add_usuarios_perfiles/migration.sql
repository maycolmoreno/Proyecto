-- CreateEnum
CREATE TYPE "perfil_funcional" AS ENUM ('DONANTE', 'SOLICITANTE', 'TRUEQUE', 'COMUNIDAD');

-- CreateTable
CREATE TABLE "usuarios_perfiles" (
    "id_usuario_perfil" UUID NOT NULL,
    "id_usuario" UUID NOT NULL,
    "perfil" "perfil_funcional" NOT NULL,
    "fecha" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "usuarios_perfiles_pkey" PRIMARY KEY ("id_usuario_perfil")
);

-- CreateIndex
CREATE UNIQUE INDEX "usuarios_perfiles_id_usuario_perfil_key" ON "usuarios_perfiles"("id_usuario", "perfil");

-- AddForeignKey
ALTER TABLE "usuarios_perfiles" ADD CONSTRAINT "usuarios_perfiles_id_usuario_fkey" FOREIGN KEY ("id_usuario") REFERENCES "usuarios"("id_usuario") ON DELETE CASCADE ON UPDATE CASCADE;

-- Opción D, Fase 2 (docs/DISENO_MODELO_PERFILES.md) — reduce el enum `rol` de 4 a 2 valores.
-- No se puede castear directamente (DONANTE/BENEFICIARIO/USUARIO_COMUNIDAD no existen en el nuevo
-- tipo): se usa el patrón expand-and-contract con columna temporal + CASE explícito.
-- Mapeo (ya reflejado 1-a-1 en usuarios_perfiles vía el backfill de la Fase 1):
--   ADMINISTRADOR                        -> ADMINISTRADOR
--   DONANTE | BENEFICIARIO | USUARIO_COMUNIDAD -> USUARIO

BEGIN;

CREATE TYPE "rol_nuevo" AS ENUM ('ADMINISTRADOR', 'USUARIO');

ALTER TABLE "usuarios" ADD COLUMN "rol_nuevo" "rol_nuevo";

UPDATE "usuarios"
SET "rol_nuevo" = CASE
  WHEN "rol" = 'ADMINISTRADOR' THEN 'ADMINISTRADOR'::"rol_nuevo"
  ELSE 'USUARIO'::"rol_nuevo"
END;

ALTER TABLE "usuarios" ALTER COLUMN "rol_nuevo" SET NOT NULL;

DROP INDEX IF EXISTS "usuarios_rol_idx";
ALTER TABLE "usuarios" DROP COLUMN "rol";
ALTER TABLE "usuarios" RENAME COLUMN "rol_nuevo" TO "rol";

DROP TYPE "rol";
ALTER TYPE "rol_nuevo" RENAME TO "rol";

CREATE INDEX "usuarios_rol_idx" ON "usuarios"("rol");

COMMIT;

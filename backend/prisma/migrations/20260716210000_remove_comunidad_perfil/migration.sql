-- ADR-049 — COMUNIDAD queda fuera del modelo de perfiles por ahora; se retoma como agregado
-- `Organizacion` independiente si se prioriza más adelante (docs/DISENO_MODELO_PERFILES.md sección 7).
-- Se eliminan las filas con perfil COMUNIDAD y se contrae el enum de 4 a 3 valores. Mismo patrón
-- expand-and-contract que 20260715030000_reduce_rol_enum (Postgres no permite DROP VALUE directo).

BEGIN;

DELETE FROM "usuarios_perfiles" WHERE "perfil" = 'COMUNIDAD';

CREATE TYPE "perfil_funcional_nuevo" AS ENUM ('DONANTE', 'SOLICITANTE', 'TRUEQUE');

ALTER TABLE "usuarios_perfiles"
  ALTER COLUMN "perfil" TYPE "perfil_funcional_nuevo"
  USING ("perfil"::text::"perfil_funcional_nuevo");

DROP TYPE "perfil_funcional";
ALTER TYPE "perfil_funcional_nuevo" RENAME TO "perfil_funcional";

COMMIT;

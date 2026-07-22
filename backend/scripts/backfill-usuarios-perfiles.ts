import { prisma } from '../main/prisma-client.js';
import { PrismaUsuarioPerfilRepository } from '@adapters/identidad/repositories/PrismaUsuarioPerfilRepository.js';
import type { PerfilFuncional } from '@domain/identidad/value-objects/PerfilFuncional.js';

/**
 * Opción D, Fase 1 (docs/DISENO_MODELO_PERFILES.md sección 7) — puebla usuarios_perfiles a partir
 * del rol actual de cada usuario, sin cambiar ningún comportamiento (rbacMiddleware/rol no se tocan).
 * Idempotente: usa upsert, se puede correr varias veces sin duplicar filas.
 *
 * Histórico tras la Fase 2 (migración `reduce_rol_enum`): las claves DONANTE/BENEFICIARIO/
 * USUARIO_COMUNIDAD ya no existen en la columna real `rol` (reducida a ADMINISTRADOR|USUARIO) —
 * se conserva el mapeo tal cual se ejecutó, por trazabilidad. Correrlo de nuevo hoy es un no-op
 * (`?? []`: ningún usuario.rol actual calza esas claves viejas).
 *
 * ADR-049 (2026-07-16): el perfil COMUNIDAD que este mapeo asignaba a USUARIO_COMUNIDAD ya no
 * existe en el enum `PerfilFuncional` — se quita del literal para que el script siga compilando;
 * no cambia el resultado (esta rama ya era un no-op, ver párrafo anterior).
 *
 * Uso: npx tsx scripts/backfill-usuarios-perfiles.ts
 */
const MAPEO_ROL_A_PERFILES: Record<string, PerfilFuncional[]> = {
  DONANTE: ['DONANTE', 'TRUEQUE'],
  BENEFICIARIO: ['SOLICITANTE'],
  USUARIO_COMUNIDAD: ['DONANTE', 'SOLICITANTE', 'TRUEQUE'],
  ADMINISTRADOR: [],
};

async function main(): Promise<void> {
  const usuarioPerfilRepository = new PrismaUsuarioPerfilRepository(prisma);
  const usuarios = await prisma.usuario.findMany({ select: { id: true, rol: true, correo: true } });

  let asignaciones = 0;
  for (const usuario of usuarios) {
    const perfiles = MAPEO_ROL_A_PERFILES[usuario.rol] ?? [];
    for (const perfil of perfiles) {
      await usuarioPerfilRepository.asignarPerfil(usuario.id, perfil);
      asignaciones++;
    }
  }

  console.log(`Backfill completo: ${usuarios.length} usuarios procesados, ${asignaciones} perfiles asignados/confirmados.`);
}

main()
  .catch((error) => {
    console.error('Backfill falló:', error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

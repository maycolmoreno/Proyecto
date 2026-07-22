import { randomUUID } from 'node:crypto';
import type { PrismaClient } from '@prisma/client';
import type { IUsuarioPerfilRepository } from '@domain/identidad/ports/IUsuarioPerfilRepository.js';
import type { PerfilFuncional } from '@domain/identidad/value-objects/PerfilFuncional.js';

/** Adaptador de salida (Opción D, Fase 1) — implementa IUsuarioPerfilRepository con Prisma. */
export class PrismaUsuarioPerfilRepository implements IUsuarioPerfilRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async asignarPerfil(usuarioId: string, perfil: PerfilFuncional): Promise<void> {
    await this.prisma.usuarioPerfil.upsert({
      where: { usuarioId_perfil: { usuarioId, perfil } },
      create: { id: randomUUID(), usuarioId, perfil },
      update: {},
    });
  }

  async quitarPerfil(usuarioId: string, perfil: PerfilFuncional): Promise<void> {
    await this.prisma.usuarioPerfil.deleteMany({ where: { usuarioId, perfil } });
  }

  async listarPerfiles(usuarioId: string): Promise<PerfilFuncional[]> {
    const rows = await this.prisma.usuarioPerfil.findMany({ where: { usuarioId } });
    return rows.map((row) => row.perfil as PerfilFuncional);
  }

  async tienePerfil(usuarioId: string, perfil: PerfilFuncional): Promise<boolean> {
    const row = await this.prisma.usuarioPerfil.findUnique({
      where: { usuarioId_perfil: { usuarioId, perfil } },
    });
    return row !== null;
  }

  async contarUsuarios(perfil: PerfilFuncional): Promise<number> {
    return this.prisma.usuarioPerfil.count({ where: { perfil } });
  }
}

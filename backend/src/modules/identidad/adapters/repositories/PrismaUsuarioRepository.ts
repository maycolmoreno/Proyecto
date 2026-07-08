import type { PrismaClient, Usuario as UsuarioRow } from '@prisma/client';
import { Usuario } from '../../domain/entities/Usuario.js';
import type { IUsuarioRepository } from '../../domain/ports/IUsuarioRepository.js';
import type { Rol } from '../../domain/value-objects/Rol.js';
import type { EstadoUsuario } from '../../domain/value-objects/EstadoUsuario.js';

/** Adaptador de salida (Hexagonal) — implementa IUsuarioRepository con Prisma (ADR-008). */
export class PrismaUsuarioRepository implements IUsuarioRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async crear(usuario: Usuario): Promise<void> {
    await this.prisma.usuario.create({
      data: {
        id: usuario.id,
        nombre: usuario.nombre,
        correo: usuario.correo,
        passwordHash: usuario.passwordHash,
        telefono: usuario.telefono,
        rol: usuario.rol,
        estado: usuario.estado,
        fechaCreacion: usuario.fechaCreacion,
      },
    });
  }

  async buscarPorCorreo(correo: string): Promise<Usuario | null> {
    const row = await this.prisma.usuario.findUnique({ where: { correo } });
    return row ? this.toDomain(row) : null;
  }

  async buscarPorId(id: string): Promise<Usuario | null> {
    const row = await this.prisma.usuario.findUnique({ where: { id } });
    return row ? this.toDomain(row) : null;
  }

  private toDomain(row: UsuarioRow): Usuario {
    return Usuario.reconstituir({
      id: row.id,
      nombre: row.nombre,
      correo: row.correo,
      passwordHash: row.passwordHash,
      telefono: row.telefono,
      rol: row.rol as Rol,
      estado: row.estado as EstadoUsuario,
      fechaCreacion: row.fechaCreacion,
    });
  }
}

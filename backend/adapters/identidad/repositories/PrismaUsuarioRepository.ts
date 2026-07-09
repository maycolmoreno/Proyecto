import type { PrismaClient, Usuario as UsuarioRow } from '@prisma/client';
import { Usuario } from '@domain/identidad/entities/Usuario.js';
import type {
  IUsuarioRepository,
  UsuarioFiltros,
  Paginacion,
  ResultadoPaginado,
} from '@domain/identidad/ports/IUsuarioRepository.js';
import type { Rol } from '@domain/identidad/value-objects/Rol.js';
import type { EstadoUsuario } from '@domain/identidad/value-objects/EstadoUsuario.js';

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

  async actualizar(usuario: Usuario): Promise<void> {
    await this.prisma.usuario.update({
      where: { id: usuario.id },
      data: { estado: usuario.estado },
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

  async listarPorRol(rol: Rol): Promise<Usuario[]> {
    const rows = await this.prisma.usuario.findMany({ where: { rol } });
    return rows.map((row) => this.toDomain(row));
  }

  async listar(filtros: UsuarioFiltros, paginacion: Paginacion): Promise<ResultadoPaginado<Usuario>> {
    const where = {
      ...(filtros.rol ? { rol: filtros.rol } : {}),
      ...(filtros.estado ? { estado: filtros.estado } : {}),
    };

    const [rows, total] = await Promise.all([
      this.prisma.usuario.findMany({
        where,
        orderBy: { fechaCreacion: 'desc' },
        skip: (paginacion.page - 1) * paginacion.limit,
        take: paginacion.limit,
      }),
      this.prisma.usuario.count({ where }),
    ]);

    return { items: rows.map((row) => this.toDomain(row)), total };
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

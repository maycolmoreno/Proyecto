import { prisma } from './prisma-client.js';
import { env } from './env.js';
import { PrismaUsuarioRepository } from '@adapters/identidad/repositories/PrismaUsuarioRepository.js';
import { BcryptPasswordHasher } from '@adapters/identidad/security/BcryptPasswordHasher.js';
import { JwtTokenService } from '@adapters/identidad/security/JwtTokenService.js';
import { RegistrarUsuarioUseCase } from '@application/identidad/use-cases/RegistrarUsuarioUseCase.js';
import { IniciarSesionUseCase } from '@application/identidad/use-cases/IniciarSesionUseCase.js';
import { AuthController } from '@adapters/identidad/controllers/auth.controller.js';
import { UsuariosController } from '@adapters/identidad/controllers/usuarios.controller.js';

// Composition root (Clean Architecture, capa Frameworks & Drivers) — único lugar
// que decide qué adaptador concreto se inyecta en cada caso de uso (ADR-042/044).

const usuarioRepository = new PrismaUsuarioRepository(prisma);
const passwordHasher = new BcryptPasswordHasher();
const tokenService = new JwtTokenService(env.JWT_SECRET);

const registrarUsuarioUseCase = new RegistrarUsuarioUseCase(usuarioRepository, passwordHasher);
const iniciarSesionUseCase = new IniciarSesionUseCase(usuarioRepository, passwordHasher, tokenService);

export const authController = new AuthController(registrarUsuarioUseCase, iniciarSesionUseCase);
export const usuariosController = new UsuariosController(usuarioRepository);

// Exportado para inyectar en middlewares transversales (ver main/middlewares/auth.middleware.ts).
export const container = { tokenService };

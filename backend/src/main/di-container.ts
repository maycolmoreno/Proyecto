import { prisma } from './prisma-client.js';
import { env } from './env.js';
import { PrismaUsuarioRepository } from '../modules/identidad/adapters/repositories/PrismaUsuarioRepository.js';
import { BcryptPasswordHasher } from '../modules/identidad/adapters/security/BcryptPasswordHasher.js';
import { JwtTokenService } from '../modules/identidad/adapters/security/JwtTokenService.js';
import { RegistrarUsuarioUseCase } from '../modules/identidad/application/use-cases/RegistrarUsuarioUseCase.js';
import { IniciarSesionUseCase } from '../modules/identidad/application/use-cases/IniciarSesionUseCase.js';
import { AuthController } from '../modules/identidad/adapters/controllers/auth.controller.js';
import { UsuariosController } from '../modules/identidad/adapters/controllers/usuarios.controller.js';

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

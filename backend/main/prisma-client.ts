import { PrismaClient } from '@prisma/client';

// Instancia única de PrismaClient — composition root (Clean Architecture, capa Frameworks & Drivers).
export const prisma = new PrismaClient();

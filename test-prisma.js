const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

console.log('Company model fields:', Object.keys(prisma.company));
prisma.$disconnect();

import pkg from '@prisma/client';
const { PrismaClient } = pkg;
const prisma = new PrismaClient();
prisma.user.findFirst({where: {role: 'TEACHER'}}).then(u => {console.log(u); process.exit(0);});

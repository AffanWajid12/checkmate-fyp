import prisma from './src/config/prismaClient.js';
console.log(Object.keys(prisma).filter(k => !k.startsWith('_')));
process.exit(0);

const { PrismaClient } = require('@prisma/client');
module.exports = global.__prisma || (global.__prisma = new PrismaClient());

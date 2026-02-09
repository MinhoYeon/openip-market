require('dotenv').config();
const { PrismaClient } = require('@prisma/client');

console.log('DATABASE_URL from env:', process.env.DATABASE_URL);

// No arguments, let it pick up from .env or prisma.config.ts
const prisma = new PrismaClient();

async function main() {
  try {
    const user = await prisma.user.upsert({
      where: { email: 'test@example.com' },
      update: {},
      create: {
        email: 'test@example.com',
        name: 'Test User',
        role: 'Owner'
      }
    });
    console.log('Success! User:', user);
  } catch (err) {
    console.error('Database operation failed:', err);
  } finally {
    await prisma.$disconnect();
  }
}

main();

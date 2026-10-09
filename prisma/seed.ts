import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding PostgreSQL database...');

  // 1. Create or upsert Admin User
  const passwordHash = await bcrypt.hash('Password123', 10);
  const user = await prisma.user.upsert({
    where: { email: 'admin@cendanatech.com' },
    update: { passwordHash, isActive: true },
    create: {
      id: 'usr-admin-1',
      name: 'Administrator',
      email: 'admin@cendanatech.com',
      passwordHash,
      isActive: true,
    },
  });
  console.log('User created:', user.email);

  // 2. Create or upsert Default Company Workspace
  const wsCompany = await prisma.workspace.upsert({
    where: { slug: 'cendana-solution' },
    update: {},
    create: {
      id: 'ws-default-1',
      name: 'PT Cendana Solution Enterprise',
      slug: 'cendana-solution',
      type: 'company',
      ownerId: user.id,
      companyProfile: {
        create: {
          legalName: 'PT Cendana Solution Enterprise',
          displayName: 'Cendana Tech',
          email: 'admin@cendanatech.com',
          currency: 'IDR',
          timezone: 'Asia/Jakarta',
        },
      },
    },
  });
  console.log('Workspace company created:', wsCompany.name);

  // 3. Create or upsert Freelance Workspace
  const wsPersonal = await prisma.workspace.upsert({
    where: { slug: 'personal-freelance' },
    update: {},
    create: {
      id: 'ws-personal-1',
      name: 'Personal Freelance Workspace',
      slug: 'personal-freelance',
      type: 'personal',
      ownerId: user.id,
    },
  });
  console.log('Workspace personal created:', wsPersonal.name);
  console.log('Clean seed completed successfully! No dummy data generated.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

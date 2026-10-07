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

  // 4. Create sample Customers
  const customer1 = await prisma.customer.upsert({
    where: { id: 'cust-sinarmaju-1' },
    update: {},
    create: {
      id: 'cust-sinarmaju-1',
      workspaceId: wsCompany.id,
      name: 'PT Sinar Maju Bersama',
      email: 'finance@sinarmaju.com',
      phone: '081234567890',
      address: 'Jl. Jenderal Sudirman No. 45, Jakarta Pusat',
      taxNumber: '01.234.567.8-012.000',
    },
  });

  const customer2 = await prisma.customer.upsert({
    where: { id: 'cust-nusantara-2' },
    update: {},
    create: {
      id: 'cust-nusantara-2',
      workspaceId: wsCompany.id,
      name: 'CV Nusantara Digital Kreatif',
      email: 'halo@nusantaradigital.id',
      phone: '082198765432',
      address: 'Jl. Pemuda No. 12, Bandung',
    },
  });
  console.log('Customers created:', customer1.name, customer2.name);

  // 5. Create sample Project with Milestones
  const project1 = await prisma.project.upsert({
    where: { id: 'proj-sinarmaju-1' },
    update: {},
    create: {
      id: 'proj-sinarmaju-1',
      workspaceId: wsCompany.id,
      customerId: customer1.id,
      name: 'Pengembangan ERP & Billing Platform',
      description: 'Implementasi sistem multi-tenant invoice and automated reporting.',
      billingType: 'milestone',
      totalBudget: 25000000,
      status: 'active',
      milestones: {
        create: [
          {
            title: 'DP 50% Inisiasi & UI/UX Design System',
            amount: 12500000,
            percentage: 50,
            status: 'completed',
          },
          {
            title: 'Termin 2: Core Engine & API Integration',
            amount: 7500000,
            percentage: 30,
            status: 'in_progress',
          },
          {
            title: 'Pelunasan 20%: Deployment & Handover QA',
            amount: 5000000,
            percentage: 20,
            status: 'pending',
          },
        ],
      },
    },
  });
  console.log('Project created:', project1.name);

  // 6. Create sample Invoices
  const invoice1 = await prisma.invoice.upsert({
    where: { workspaceId_invoiceNumber: { workspaceId: wsCompany.id, invoiceNumber: 'INV-2026-0001' } },
    update: {},
    create: {
      workspaceId: wsCompany.id,
      customerId: customer1.id,
      projectId: project1.id,
      invoiceNumber: 'INV-2026-0001',
      status: 'paid',
      issueDate: new Date('2026-09-15'),
      dueDate: new Date('2026-09-30'),
      subtotal: 12500000,
      tax: 1375000,
      discount: 0,
      total: 13875000,
      amountPaid: 13875000,
      amountDue: 0,
      currency: 'IDR',
      notes: 'Pembayaran DP 50% Inisiasi & UI/UX telah diterima.',
      items: {
        create: [
          {
            description: 'DP 50% Inisiasi Project & UI/UX Design',
            quantity: 1,
            unit: 'paket',
            unitPrice: 12500000,
            subtotal: 12500000,
            tax: 1375000,
            taxRate: 11,
            total: 13875000,
          },
        ],
      },
      payments: {
        create: [
          {
            amount: 13875000,
            paymentDate: new Date('2026-09-20'),
            referenceNumber: 'TRX-BCA-98127391',
            status: 'completed',
            notes: 'Transfer Bank BCA',
          },
        ],
      },
    },
  });

  const invoice2 = await prisma.invoice.upsert({
    where: { workspaceId_invoiceNumber: { workspaceId: wsCompany.id, invoiceNumber: 'INV-2026-0002' } },
    update: {},
    create: {
      workspaceId: wsCompany.id,
      customerId: customer2.id,
      invoiceNumber: 'INV-2026-0002',
      status: 'unpaid',
      issueDate: new Date('2026-10-01'),
      dueDate: new Date('2026-10-15'),
      subtotal: 4500000,
      tax: 495000,
      discount: 0,
      total: 4995000,
      amountPaid: 0,
      amountDue: 4995000,
      currency: 'IDR',
      notes: 'Jasa Maintenance Server & Optimasi Cloud Oktober 2026.',
      items: {
        create: [
          {
            description: 'Cloud Infrastructure & Managed Server Maintenance',
            quantity: 1,
            unit: 'bulan',
            unitPrice: 4500000,
            subtotal: 4500000,
            tax: 495000,
            taxRate: 11,
            total: 4995000,
          },
        ],
      },
    },
  });

  console.log('Invoices created:', invoice1.invoiceNumber, invoice2.invoiceNumber);
  console.log('Database seeded successfully!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

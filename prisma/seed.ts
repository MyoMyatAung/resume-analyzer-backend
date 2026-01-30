import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  // Create default admin user
  const adminEmail = process.env.ADMIN_EMAIL || 'admin@example.com';
  const adminPassword = process.env.ADMIN_PASSWORD || 'Admin123!';

  const existingAdmin = await prisma.admin.findUnique({
    where: { email: adminEmail },
  });

  if (existingAdmin) {
    console.log(`Admin user already exists: ${adminEmail}`);
    return;
  }

  const hashedPassword = await bcrypt.hash(adminPassword, 12);

  const admin = await prisma.admin.create({
    data: {
      email: adminEmail,
      password: hashedPassword,
      firstName: 'System',
      lastName: 'Admin',
      role: 'SUPER_ADMIN',
    },
  });

  console.log(`Created admin user: ${admin.email}`);
  console.log('');
  console.log('='.repeat(50));
  console.log('IMPORTANT: Change the default password after first login!');
  console.log('='.repeat(50));
  console.log('');
  console.log('Default credentials:');
  console.log(`  Email: ${adminEmail}`);
  console.log(`  Password: ${adminPassword}`);
  console.log('');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

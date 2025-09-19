import { PrismaClient } from '@prisma/client';
import { hashPassword } from '../src/utils/password';
import { config } from '../src/config';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting database seed...');

  // Create admin user
  const adminPassword = await hashPassword(config.admin.password);

  const admin = await prisma.user.upsert({
    where: { phone: config.admin.phone },
    update: {},
    create: {
      phone: config.admin.phone,
      fullName: config.admin.name,
      password: adminPassword,
      role: 'ADMIN',
      level: 'EXPERT',
      position: 'SHIFT_MANAGER',
      isActive: true,
      tokenUsed: true,
    },
  });

  console.log('✅ Created admin user:', admin.phone);

  // Create some test employees with registration tokens
  const testEmployees = [
    {
      phone: '0501234568',
      fullName: 'דני כהן',
      role: 'EMPLOYEE',
      level: 'EXPERT',
      position: 'SERVER',
    },
    {
      phone: '0501234569',
      fullName: 'שירה לוי',
      role: 'EMPLOYEE',
      level: 'EXPERT',
      position: 'SHIFT_MANAGER',
    },
    {
      phone: '0501234570',
      fullName: 'יוסי אברהם',
      role: 'EMPLOYEE',
      level: 'RUNNER',
      position: 'SERVER',
    },
    {
      phone: '0501234571',
      fullName: 'מיכל דוד',
      role: 'EMPLOYEE',
      level: 'TRAINEE',
      position: 'SERVER',
    },
    {
      phone: '0501234572',
      fullName: 'רון ביטון',
      role: 'EMPLOYEE',
      level: 'INTERMEDIATE',
      position: 'BARTENDER',
    },
  ];

  for (const employee of testEmployees) {
    const registrationToken = Math.random().toString(36).substring(2, 15);

    const user = await prisma.user.upsert({
      where: { phone: employee.phone },
      update: {},
      create: {
        ...employee,
        registrationToken,
        tokenUsed: false,
        isActive: true,
      },
    });

    console.log(`✅ Created employee: ${user.fullName} (${user.phone})`);
    console.log(`   Registration token: ${registrationToken}`);
  }

  console.log('\n🎉 Seed completed successfully!');
  console.log('\n📝 Admin credentials:');
  console.log(`   Phone: ${config.admin.phone}`);
  console.log(`   Password: ${config.admin.password}`);
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
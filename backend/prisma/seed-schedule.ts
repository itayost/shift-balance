import { PrismaClient, ShiftType, EmployeePosition } from '@prisma/client';
import { startOfWeek, addDays } from 'date-fns';

const prisma = new PrismaClient();

async function main() {
  console.log('🗓️ Creating sample schedule...');

  // Get the start of current week (Sunday)
  const weekStart = startOfWeek(new Date(), { weekStartsOn: 0 });
  const weekEnd = addDays(weekStart, 6);

  // Check if schedule already exists
  let schedule = await prisma.weeklySchedule.findFirst({
    where: {
      weekStartDate: {
        lte: weekEnd,
      },
      weekEndDate: {
        gte: weekStart,
      },
    },
  });

  if (schedule) {
    console.log('⚠️ Schedule already exists for this week, checking for shifts...');

    // Check if shifts exist
    const shiftsCount = await prisma.shift.count({
      where: {
        scheduleId: schedule.id
      }
    });

    if (shiftsCount > 0) {
      console.log(`✅ Schedule has ${shiftsCount} shifts already`);

      // Update the schedule to be published if not already
      if (!schedule.isPublished) {
        schedule = await prisma.weeklySchedule.update({
          where: { id: schedule.id },
          data: {
            isPublished: true,
            publishedAt: new Date(),
          }
        });
        console.log('✅ Schedule published');
      }
      return;
    }

    console.log('📝 Adding shifts to existing schedule...');
  } else {
    // Get all employees
    const employees = await prisma.user.findMany({
      where: {
        isActive: true,
      },
    });

    // Create weekly schedule
    schedule = await prisma.weeklySchedule.create({
      data: {
        weekStartDate: weekStart,
        weekEndDate: weekEnd,
        requiredStaff: {
          lunch: 8,
          dinner: 12,
        },
        isPublished: true,
        publishedAt: new Date(),
        publishedBy: employees.find(e => e.role === 'ADMIN')?.id || null,
      },
    });

    console.log('✅ Created schedule for week:', weekStart.toLocaleDateString());
  }

  // Get all employees for shift assignment
  const employees = await prisma.user.findMany({
    where: {
      isActive: true,
    },
  });

  const servers = employees.filter(e => e.position === EmployeePosition.SERVER);
  const bartenders = employees.filter(e => e.position === EmployeePosition.BARTENDER);
  const shiftManagers = employees.filter(e => e.position === EmployeePosition.SHIFT_MANAGER);

  // Create shifts for each day
  for (let i = 0; i < 7; i++) {
    const shiftDate = addDays(weekStart, i);

    // Create lunch shift (11:00-16:00)
    const lunchShift = await prisma.shift.create({
      data: {
        scheduleId: schedule.id,
        date: shiftDate,
        type: ShiftType.LUNCH,
        startTime: '11:00',
        endTime: '16:00',
        minimumStaff: 6,
        shiftManagerId: shiftManagers[i % shiftManagers.length]?.id || null,
        isBalanced: true,
        qualityScore: 75,
      },
    });

    // Assign some employees to lunch shift
    const lunchEmployees = servers.slice(0, Math.min(4, servers.length));
    if (lunchEmployees.length > 0) {
      await prisma.shift.update({
        where: { id: lunchShift.id },
        data: {
          employees: {
            connect: lunchEmployees.map(e => ({ id: e.id })),
          },
        },
      });
    }

    // Add bartender if available
    if (bartenders.length > 0) {
      await prisma.shift.update({
        where: { id: lunchShift.id },
        data: {
          employees: {
            connect: { id: bartenders[i % bartenders.length].id },
          },
        },
      });
    }

    // Create dinner shift (18:00-23:00)
    const dinnerShift = await prisma.shift.create({
      data: {
        scheduleId: schedule.id,
        date: shiftDate,
        type: ShiftType.DINNER,
        startTime: '18:00',
        endTime: '23:00',
        minimumStaff: 10,
        shiftManagerId: shiftManagers[(i + 1) % shiftManagers.length]?.id || null,
        isBalanced: true,
        qualityScore: 85,
      },
    });

    // Assign some employees to dinner shift
    const dinnerEmployees = servers.slice(2, Math.min(6, servers.length));
    if (dinnerEmployees.length > 0) {
      await prisma.shift.update({
        where: { id: dinnerShift.id },
        data: {
          employees: {
            connect: dinnerEmployees.map(e => ({ id: e.id })),
          },
        },
      });
    }

    // Add bartender if available
    if (bartenders.length > 0) {
      await prisma.shift.update({
        where: { id: dinnerShift.id },
        data: {
          employees: {
            connect: { id: bartenders[(i + 1) % bartenders.length].id },
          },
        },
      });
    }
  }

  console.log('✅ Created shifts for the week');
  console.log('🎉 Sample schedule created successfully!');
}

main()
  .catch((e) => {
    console.error('❌ Error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
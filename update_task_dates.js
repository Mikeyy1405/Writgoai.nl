
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function updateTaskDates() {
  try {
    // Haal alle content automation taken op, gesorteerd op createdAt
    const tasks = await prisma.task.findMany({
      where: {
        category: 'CONTENT_AUTOMATION',
      },
      orderBy: {
        createdAt: 'asc',
      },
    });

    console.log(`Found ${tasks.length} content automation tasks`);

    // Bereken nieuwe deadlines
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1); // Start vanaf morgen
    tomorrow.setHours(12, 0, 0, 0); // Zet tijd op 12:00 uur

    for (let i = 0; i < tasks.length; i++) {
      const task = tasks[i];
      
      // Bereken deadline: verspreid artikelen over 3 dagen (voor eerste 3), daarna 1 per week
      const daysOffset = i < 3 ? i : 3 + Math.floor((i - 3) * 7);
      const newDeadline = new Date(tomorrow);
      newDeadline.setDate(newDeadline.getDate() + daysOffset);

      await prisma.task.update({
        where: { id: task.id },
        data: { deadline: newDeadline },
      });

      console.log(`Updated task ${i + 1}: ${task.title} -> ${newDeadline.toLocaleDateString('nl-NL')}`);
    }

    console.log('✅ All task dates updated!');
  } catch (error) {
    console.error('Error updating task dates:', error);
  } finally {
    await prisma.$disconnect();
  }
}

updateTaskDates();

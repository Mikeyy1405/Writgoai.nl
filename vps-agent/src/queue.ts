import { Queue, Worker, Job } from 'bullmq';
import IORedis from 'ioredis';
import { publishArticle } from './wordpress-publisher';

const connection = new IORedis(process.env.REDIS_URL || 'redis://localhost:6379', {
  maxRetriesPerRequest: null
});

export const publishQueue = new Queue('wordpress-publish', {
  connection,
  defaultJobOptions: {
    attempts: 2,
    backoff: {
      type: 'exponential',
      delay: 5000
    },
    removeOnComplete: 100,
    removeOnFail: 50
  }
});

let worker: Worker | null = null;

export function setupQueue() {
  worker = new Worker(
    'wordpress-publish',
    async (job: Job) => {
      console.log(`\n📋 Processing job ${job.id}...`);
      console.log(`Topic: ${job.data.topic}`);
      console.log(`Site: ${job.data.site}`);

      const result = await publishArticle(job.data);

      if (!result.success) {
        throw new Error(result.error);
      }

      return result;
    },
    {
      connection,
      concurrency: 2, // Process 2 articles at a time
      limiter: {
        max: 10,
        duration: 60000 // Max 10 articles per minute
      }
    }
  );

  worker.on('completed', (job, result) => {
    console.log(`✅ Job ${job.id} completed successfully!`);
    console.log(`   URL: ${result.url}`);
  });

  worker.on('failed', (job, err) => {
    console.error(`❌ Job ${job?.id} failed:`, err.message);
  });

  console.log('✓ Queue worker started');
}

export async function addPublishJob(data: any) {
  return await publishQueue.add('publish', data);
}

export async function getQueueStats() {
  return {
    waiting: await publishQueue.getWaitingCount(),
    active: await publishQueue.getActiveCount(),
    completed: await publishQueue.getCompletedCount(),
    failed: await publishQueue.getFailedCount()
  };
}

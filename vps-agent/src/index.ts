import express from 'express';
import { publishArticle, testLogin } from './wordpress-publisher';
import { setupQueue, addPublishJob } from './queue';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
app.use(express.json());

// Security middleware
function authenticate(req: express.Request, res: express.Response, next: express.NextFunction) {
  const apiSecret = req.headers['x-api-secret'];

  if (apiSecret !== process.env.VPS_API_SECRET) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  next();
}

app.use(authenticate);

// Main endpoint - Publiceer artikel
app.post('/publish', async (req, res) => {
  const { topic, site, instructions, category, tags, publishImmediately = true } = req.body;

  if (!topic || !site) {
    return res.status(400).json({
      error: 'topic and site are required',
      example: {
        topic: 'Yoga voor beginners',
        site: 'yogastartgids.nl'
      }
    });
  }

  try {
    // Add to queue
    const job = await addPublishJob({
      topic,
      site,
      instructions,
      category,
      tags,
      publishImmediately
    });

    res.json({
      success: true,
      message: 'Article queued for publishing',
      jobId: job.id,
      estimatedTime: '2-3 minutes'
    });
  } catch (error: any) {
    console.error('Failed to queue job:', error);
    res.status(500).json({
      error: 'Failed to queue publish job',
      details: error.message
    });
  }
});

// Test login endpoint
app.post('/test-login', async (req, res) => {
  const { site } = req.body;

  if (!site) {
    return res.status(400).json({ error: 'site is required' });
  }

  try {
    const result = await testLogin(site);
    res.json(result);
  } catch (error: any) {
    res.status(500).json({
      error: 'Login test failed',
      details: error.message
    });
  }
});

// Status endpoint
app.get('/status', async (req, res) => {
  // TODO: Get queue stats from BullMQ
  res.json({
    status: 'running',
    uptime: process.uptime(),
    timestamp: new Date().toISOString()
  });
});

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok' });
});

const PORT = process.env.PORT || 3001;

// Start queue processor
setupQueue();

app.listen(PORT, () => {
  console.log(`🤖 Writgo VPS Agent running on port ${PORT}`);
  console.log(`📝 Ready to publish articles automatically!`);
});

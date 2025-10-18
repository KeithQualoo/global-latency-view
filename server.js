const express = require('express');
const { Pool } = require('pg');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const path = require('path');
const compression = require('compression');
const pino = require('pino');
const pinoHttp = require('pino-http');
const { cleanEnv, str, port: envPort } = require('envalid');
const { check, validationResult } = require('express-validator');
require('dotenv').config({ path: '.env' });

const logger = pino({ level: process.env.LOG_LEVEL || 'info' });

const app = express();
const env = cleanEnv(process.env, {
  PORT: envPort({ default: 8000 }), // Changed to 8000 to match frontend
  DB_USER: str({ default: 'postgres' }),
  DB_HOST: str({ default: 'localhost' }),
  DB_NAME: str({ default: 'postgres' }),
  DB_PASSWORD: str({ default: 'eUgZp5iJ3OieR9' }),
  DB_PORT: envPort({ default: 5501 }),
  OPENAI_API_KEY: str({ default: '' }),
  ELEVENLABS_API_KEY: str({ default: '' })
});

const port = env.PORT;

// Database connection configuration
const dbConfig = {
  user: env.DB_USER,
  host: env.DB_HOST,
  database: env.DB_NAME,
  password: env.DB_PASSWORD,
  port: env.DB_PORT,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: true } : { rejectUnauthorized: false },
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
};

// Create a new pool instance
const pool = new Pool(dbConfig);

// Test database connection with retry logic
const testConnection = async (attempt = 1, maxRetries = 5, timeout = 5000) => {
  try {
    const client = await pool.connect();
    await client.query('SELECT NOW()');
    client.release();
    logger.info('✅ Successfully connected to PostgreSQL');
    return true;
  } catch (err) {
    if (attempt <= maxRetries) {
      const delay = timeout * Math.pow(2, attempt - 1);
      logger.warn(`⚠️ Connection attempt ${attempt} failed, retrying in ${delay / 1000}s... Error: ${err.message}`);
      await new Promise((resolve) => setTimeout(resolve, delay));
      return testConnection(attempt + 1, maxRetries, timeout);
    }
    logger.error('❌ Max retries reached. Failed to connect to PostgreSQL: %s', err.message);
    logger.info('🔧 Troubleshooting steps:');
    logger.info('1. Ensure PostgreSQL is running on %s:%d', env.DB_HOST, env.DB_PORT);
    logger.info('2. Verify .env credentials: %o', { DB_USER: env.DB_USER, DB_HOST: env.DB_HOST, DB_PORT: env.DB_PORT, DB_NAME: env.DB_NAME });
    logger.info('3. Check database existence and permissions');
    logger.info('4. Verify pg_hba.conf settings');
    logger.info('Current config: %o', { ...dbConfig, password: '***', ssl: dbConfig.ssl ? 'enabled' : 'disabled' });
    throw new Error('Database connection failed');
  }
};

// Middleware setup
app.use(pinoHttp({ logger }));
app.use(compression());

app.use(
  helmet({
    contentSecurityPolicy: process.env.NODE_ENV === 'production' ? {
      directives: {
        ...helmet.contentSecurityPolicy.getDefaultDirectives(),
        'img-src': ["'self'", 'data:', 'https://cdn.jsdelivr.net'],
        'script-src': ["'self'", 'https://cdn.jsdelivr.net', 'https://unpkg.com'],
        'connect-src': ["'self'", 'http://localhost:8000', 'https://api.openai.com', 'https://api.elevenlabs.io'],
        'media-src': ["'self'", 'blob:'],
        'worker-src': ["'self'", 'blob:'],
      },
    } : false,
  })
);

app.use(cors({
  origin: 'http://localhost:8000', // Specific origin for development
  credentials: true,
  methods: ['GET', 'POST', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-ElevenLabs-Key', 'xi-api-key', 'X-OpenAI-Key']
}));

app.options('*', cors());

// Remove express-rate-limit middleware
// app.use(
//   rateLimit({
//     windowMs: 15 * 60 * 1000,
//     max: 100,
//     message: { success: false, error: 'Too many requests, please try again later.' },
//   })
// );
// Rate limiting removed for development/testing.

app.use(express.json());

// Serve static files
app.use(express.static(__dirname, {
  setHeaders: (res, filePath) => {
    if (/\.(js|css|png|jpg|jpeg|gif|ico|svg)$/.test(filePath)) {
      res.set('Cache-Control', 'public, max-age=86400');
    }
    if (/\.m?js$/.test(filePath)) {
      res.type('application/javascript');
    }
  },
  dotfiles: 'allow',
  index: false
}));

// Routes
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'), {
    headers: {
      'Content-Type': 'text/html',
      'Cache-Control': 'no-cache, no-store, must-revalidate'
    }
  });
});

app.get('/app.js', (req, res) => {
  res.sendFile(path.join(__dirname, 'app.js'), {
    headers: {
      'Content-Type': 'application/javascript',
      'Cache-Control': 'no-cache, no-store, must-revalidate'
    }
  });
});

// Secure TTS proxy using server-side OpenAI key (no key leaks to client)
app.post('/api/tts', async (req, res) => {
  try {
    const apiKey = env.OPENAI_API_KEY;
    if (!apiKey) {
      return res.status(400).json({ error: 'OPENAI_API_KEY is not configured on the server' });
    }
    const { text, voice = 'nova', model = 'gpt-4o-mini-tts' } = req.body || {};
    if (!text || typeof text !== 'string' || text.trim().length === 0) {
      return res.status(400).json({ error: 'Missing text for TTS' });
    }

    const resp = await fetch('https://api.openai.com/v1/audio/speech', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ model, input: text, voice })
    });

    if (!resp.ok) {
      const msg = await resp.text().catch(() => '');
      logger.error('OpenAI TTS error: %s', msg);
      return res.status(resp.status).json({ error: 'OpenAI TTS request failed' });
    }

    const arrayBuf = await resp.arrayBuffer();
    res.setHeader('Content-Type', 'audio/mpeg');
    res.setHeader('Cache-Control', 'no-store');
    return res.send(Buffer.from(arrayBuf));
  } catch (err) {
    logger.error('TTS proxy error: %o', err);
    return res.status(500).json({ error: 'TTS proxy failed' });
  }
});

// ElevenLabs TTS proxy (server-side key usage)
app.post('/api/tts/eleven', async (req, res) => {
  try {
    const headerKey = req.get('X-ElevenLabs-Key') || req.get('xi-api-key');
    const elevenKey = env.ELEVENLABS_API_KEY || (process.env.NODE_ENV !== 'production' ? headerKey : '');
    if (!elevenKey) {
      return res.status(400).json({ error: 'ELEVENLABS_API_KEY missing. Set server env or send X-ElevenLabs-Key header in development.' });
    }
    const {
      text,
      voiceId = 'yf18OYKcMjTlVAGNuq5t',
      model = 'eleven_multilingual_v2',
      output_format = 'mp3_44100_128',
      language_code = null
    } = req.body || {};
    if (!text || typeof text !== 'string' || text.trim().length === 0) {
      return res.status(400).json({ error: 'Missing text for TTS' });
    }

    const url = `https://api.elevenlabs.io/v1/text-to-speech/${encodeURIComponent(voiceId)}`;
    const resp = await fetch(url + `?output_format=${encodeURIComponent(output_format)}` , {
      method: 'POST',
      headers: {
        'xi-api-key': elevenKey,
        'Content-Type': 'application/json',
        'Accept': 'audio/mpeg'
      },
      body: JSON.stringify({
        model_id: model,
        text,
        ...(language_code ? { language_code } : {}),
        // Voice settings optional; defaults are fine
      })
    });

    if (!resp.ok) {
      const msg = await resp.text().catch(() => '');
      logger.error('ElevenLabs TTS error: %s', msg);
      return res.status(resp.status).json({ error: 'ElevenLabs TTS request failed' });
    }

    const arrayBuf = await resp.arrayBuffer();
    res.setHeader('Content-Type', 'audio/mpeg');
    res.setHeader('Cache-Control', 'no-store');
    return res.send(Buffer.from(arrayBuf));
  } catch (err) {
    logger.error('ElevenLabs TTS proxy error: %o', err);
    return res.status(500).json({ error: 'ElevenLabs TTS proxy failed' });
  }
});

// Simple translation endpoint using OpenAI
app.post('/api/translate', async (req, res) => {
  try {
    const headerKey = req.get('X-OpenAI-Key');
    const apiKey = env.OPENAI_API_KEY || (process.env.NODE_ENV !== 'production' ? headerKey : '');
    if (!apiKey) {
      return res.status(400).json({ error: 'OPENAI_API_KEY missing. Set server env or send X-OpenAI-Key header in development.' });
    }
    const { text, targetLang } = req.body || {};
    if (!text || typeof text !== 'string' || text.trim().length === 0) {
      return res.status(400).json({ error: 'Missing text' });
    }
    if (!targetLang || typeof targetLang !== 'string') {
      return res.status(400).json({ error: 'Missing targetLang' });
    }

    // Map common short codes to language names for better prompts
    const langMap = { en: 'English', es: 'Spanish', fr: 'French', de: 'German', pt: 'Portuguese', ja: 'Japanese', zh: 'Chinese', it: 'Italian', ms: 'Malay' };
    const langName = langMap[targetLang.toLowerCase()] || targetLang;

    const resp = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          { role: 'system', content: `You are a translator. Translate the user text into ${langName}. Keep technical terms, operator names, numbers, and country names intact. Respond with translation only.` },
          { role: 'user', content: text }
        ],
        temperature: 0.2
      })
    });

    if (!resp.ok) {
      const msg = await resp.text().catch(() => '');
      logger.error('Translate error: %s', msg);
      return res.status(resp.status).json({ error: 'Translation request failed' });
    }
    const json = await resp.json();
    const translated = json?.choices?.[0]?.message?.content?.trim?.() || '';
    return res.json({ translated });
  } catch (err) {
    logger.error('Translate proxy error: %o', err);
    return res.status(500).json({ error: 'Translate proxy failed' });
  }
});

app.get('/server.js', (req, res) => {
  res.status(403).send('Access denied');
});

app.get('/8k_earth_nightmap.jpg', (req, res) => {
  res.sendFile(path.join(__dirname, '8k_earth_nightmap.jpg'), {
    headers: { 'Content-Type': 'image/jpeg', 'Cache-Control': 'public, max-age=604800' },
  });
});

app.get('/health', async (req, res) => {
  try {
    await pool.query('SELECT NOW()');
    res.json({
      status: 'OK',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      database: 'connected',
    });
  } catch (err) {
    res.status(503).json({
      status: 'ERROR',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      database: 'disconnected',
      message: 'Database unavailable',
    });
  }
});

app.get('/api/latency-data/count', async (req, res) => {
  let client;
  try {
    client = await pool.connect();
    const countQuery = `
      SELECT COUNT(DISTINCT ptr."ipAddress") as total 
      FROM public."PingTaskResults" ptr
      INNER JOIN public."PingTestHosts" pth ON ptr."ipAddress" = pth."ipAddress"
      WHERE ptr."createdAt" >= NOW() - INTERVAL '1 hour'
        AND pth."latitude" IS NOT NULL 
        AND pth."longitude" IS NOT NULL
        AND ptr."avgTime" >= 5
        AND ptr."avgTime" <= 800
        AND ptr."networkInfoId" IS NOT NULL`;
        
    const result = await client.query(countQuery);
    res.json({ total: parseInt(result.rows[0].total, 10) });
  } catch (error) {
    logger.error('Error getting record count: %o', error);
    res.status(500).json({ error: 'Failed to get record count', details: process.env.NODE_ENV === 'development' ? error.stack : undefined });
  } finally {
    if (client) client.release();
  }
});

app.get('/api/latency-data', [
  check('cursor').optional().isString(),
  check('limit').optional().isInt({ min: 1, max: 5000 }).toInt(), // Increased max limit
  check('source_country').optional().isString(),
  check('source_region').optional().isString(),
  check('operator').optional().isString(),
  check('network_type').optional().isIn(['mobile', 'wifi', 'wired', 'unknown']),
  check('dest_country').optional().isString(),
  check('dest_region').optional().isString(),
  check('start_date').optional().isISO8601(),
  check('end_date').optional().isISO8601()
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const limit = req.query.limit || 2000; // Increased default limit
  const cursor = req.query.cursor;
  const since = req.query.since; // Timestamp for incremental fetching
  const source_country = req.query.source_country;
  const source_region = req.query.source_region;
  const operator = req.query.operator;
  const network_type = req.query.network_type;
  const dest_country = req.query.dest_country;
  const dest_region = req.query.dest_region;
  const start_date = req.query.start_date;
  const end_date = req.query.end_date;

  let client;
  try {
    client = await pool.connect();

    // Use date range if provided, otherwise default to last hour
    const dateCondition = start_date && end_date 
      ? `ptr."createdAt" >= $1 AND ptr."createdAt" <= $2`
      : `ptr."createdAt" >= NOW() - INTERVAL '1 hour'`;
    const dateParams = start_date && end_date ? [start_date, end_date] : [];
    
    let countQuery = `
      SELECT COUNT(*) as total_count
      FROM public."PingTaskResults" ptr
      INNER JOIN public."PingTestHosts" pth ON ptr."ipAddress" = pth."ipAddress"
      LEFT JOIN public."NetworkInfoExtended" nie ON ptr."networkInfoId" = nie."networkInfoId"
      LEFT JOIN public."IpInfo" ipi ON ptr."networkInfoId" = ipi."networkInfoId"
      WHERE ${dateCondition}
        AND ptr."avgTime" >= 5
        AND ptr."avgTime" <= 800
        AND ptr."networkInfoId" IS NOT NULL
        AND pth."latitude" IS NOT NULL 
        AND pth."longitude" IS NOT NULL
    `;
    const countParams = [...dateParams];
    if (source_country) {
      countQuery += ` AND ptr."countryCode" = $${countParams.length + 1}`;
      countParams.push(source_country);
    }
    if (source_region) {
      countQuery += ` AND ipi."continentCode" = $${countParams.length + 1}`;
      countParams.push(source_region);
    }
    if (operator) {
      countQuery += ` AND ptr."operator" = $${countParams.length + 1}`;
      countParams.push(operator);
    }
    if (network_type) {
      countQuery += ` AND nie."networkType"::TEXT = $${countParams.length + 1}`;
      countParams.push(network_type);
    }
    if (dest_country) {
      countQuery += ` AND pth."country" = $${countParams.length + 1}`;
      countParams.push(dest_country);
    }
    if (dest_region) {
      countQuery += ` AND pth."region" = $${countParams.length + 1}`;
      countParams.push(dest_region);
    }
    if (since) {
      countQuery += ` AND ptr."createdAt" > to_timestamp($${countParams.length + 1})`;
      countParams.push(since);
    }

    const countResult = await client.query(countQuery, countParams);
    const totalCount = parseInt(countResult.rows[0].total_count, 10);

    let dataQuery = `
      SELECT 
        ptr."id",
        ptr."networkInfoId",
        ptr."ipAddress",
        ptr."avgTime",
        ptr."createdAt" as created_at,
        ptr."taskId",
        ptr."hexBin" as source_hexbin,
        COALESCE(nie."networkType"::TEXT, 'unknown') as network_type,
        ptr."operator",
        ptr."userId",
        ptr."maxTime",
        ptr."minTime",
        ptr."avgJitter",
        ptr."maxJitter",
        ptr."packetLoss",
        ptr."countryCode" as source_country,
        ipi."continentCode" as source_region,
        ipi."organization" as ipinfo_organization,
        ptr."dstAsn",
        ptr."srcAsn",
        pth."latitude" as dest_latitude,
        pth."longitude" as dest_longitude,
        pth."country" as dest_country,
        pth."region" as dest_region,
        pth."reference" as dest_reference,
        pth."location" as dest_location,
        COALESCE(li."latitude", 0) as source_latitude,
        COALESCE(li."longitude", 0) as source_longitude
      FROM public."PingTaskResults" ptr
      INNER JOIN public."PingTestHosts" pth ON ptr."ipAddress" = pth."ipAddress"
      LEFT JOIN public."NetworkInfoExtended" nie ON ptr."networkInfoId" = nie."networkInfoId"
      LEFT JOIN public."LocationInfo" li ON ptr."networkInfoId" = li."networkInfoId"
      LEFT JOIN public."IpInfo" ipi ON ptr."networkInfoId" = ipi."networkInfoId"
      WHERE ${dateCondition}
        AND ptr."avgTime" >= 5
        AND ptr."avgTime" <= 2000
        AND ptr."networkInfoId" IS NOT NULL
        AND pth."latitude" IS NOT NULL 
        AND pth."longitude" IS NOT NULL
    `;
    const dataParams = [...dateParams];
    if (source_country) {
      dataQuery += ` AND ptr."countryCode" = $${dataParams.length + 1}`;
      dataParams.push(source_country);
    }
    if (source_region) {
      dataQuery += ` AND ipi."continentCode" = $${dataParams.length + 1}`;
      dataParams.push(source_region);
    }
    if (operator) {
      dataQuery += ` AND ptr."operator" = $${dataParams.length + 1}`;
      dataParams.push(operator);
    }
    if (network_type) {
      dataQuery += ` AND nie."networkType"::TEXT = $${dataParams.length + 1}`;
      dataParams.push(network_type);
    }
    if (dest_country) {
      dataQuery += ` AND pth."country" = $${dataParams.length + 1}`;
      dataParams.push(dest_country);
    }
    if (dest_region) {
      dataQuery += ` AND pth."region" = $${dataParams.length + 1}`;
      dataParams.push(dest_region);
    }
    if (since) {
      dataQuery += ` AND ptr."createdAt" > to_timestamp($${dataParams.length + 1})`;
      dataParams.push(since);
    }

    if (cursor) {
      dataQuery += ` AND ptr."id" < $${dataParams.length + 1}`;
      dataParams.push(cursor);
    }
    dataQuery += ` ORDER BY ptr."createdAt" DESC, ptr."id" DESC LIMIT $${dataParams.length + 1}`;
    dataParams.push(limit);

    const result = await client.query(dataQuery, dataParams);
    const rows = result.rows;
    const nextCursor = rows.length > 0 ? rows[rows.length - 1].id : null;
    const hasMore = rows.length === limit;

    logger.info(`Sending batch with ${rows.length} rows (total: ${totalCount})`);

    res.json({
      data: rows,
      pagination: {
        nextCursor,
        limit,
        total: totalCount,
        hasMore
      }
    });
  } catch (error) {
    logger.error('Error in /api/latency-data: %o', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
      message: process.env.NODE_ENV === 'development' ? error.message : 'Failed to fetch latency data.',
      details: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  } finally {
    if (client) client.release();
  }
});

// New endpoints for unique values
app.get('/api/unique/source_countries', async (req, res) => {
  let client;
  try {
    client = await pool.connect();
    const query = `
      SELECT DISTINCT ptr."countryCode" as value
      FROM public."PingTaskResults" ptr
      WHERE ptr."countryCode" IS NOT NULL
        AND ptr."createdAt" >= NOW() - INTERVAL '1 hour'
      ORDER BY value
    `;
    const result = await client.query(query);
    res.json(result.rows.map(row => row.value));
  } catch (error) {
    logger.error('Error fetching unique source_countries:', error);
    res.status(500).json({ error: 'Failed to fetch unique source countries' });
  } finally {
    if (client) client.release();
  }
});

app.get('/api/unique/source_regions', async (req, res) => {
  let client;
  try {
    client = await pool.connect();
    const query = `
      SELECT DISTINCT ipi."continentCode" as value
      FROM public."PingTaskResults" ptr
      LEFT JOIN public."IpInfo" ipi ON ptr."networkInfoId" = ipi."networkInfoId"
      WHERE ipi."continentCode" IS NOT NULL
        AND ptr."createdAt" >= NOW() - INTERVAL '1 hour'
      ORDER BY value
    `;
    const result = await client.query(query);
    res.json(result.rows.map(row => row.value));
  } catch (error) {
    logger.error('Error fetching unique source_regions:', error);
    res.status(500).json({ error: 'Failed to fetch unique source regions' });
  } finally {
    if (client) client.release();
  }
});

app.get('/api/unique/operators', async (req, res) => {
  let client;
  try {
    client = await pool.connect();
    const query = `
      SELECT DISTINCT ptr."operator" as value
      FROM public."PingTaskResults" ptr
      WHERE ptr."operator" IS NOT NULL
        AND ptr."createdAt" >= NOW() - INTERVAL '1 hour'
      ORDER BY value
    `;
    const result = await client.query(query);
    res.json(result.rows.map(row => row.value));
  } catch (error) {
    logger.error('Error fetching unique operators:', error);
    res.status(500).json({ error: 'Failed to fetch unique operators' });
  } finally {
    if (client) client.release();
  }
});

app.get('/api/unique/network_types', async (req, res) => {
  let client;
  try {
    client = await pool.connect();
    const query = `
      SELECT DISTINCT COALESCE(nie."networkType"::TEXT, 'unknown') as value
      FROM public."PingTaskResults" ptr
      LEFT JOIN public."NetworkInfoExtended" nie ON ptr."networkInfoId" = nie."networkInfoId"
      WHERE nie."networkType" IS NOT NULL
        AND ptr."createdAt" >= NOW() - INTERVAL '1 hour'
      ORDER BY value
    `;
    const result = await client.query(query);
    res.json(result.rows.map(row => row.value));
  } catch (error) {
    logger.error('Error fetching unique network_types:', error);
    res.status(500).json({ error: 'Failed to fetch unique network types' });
  } finally {
    if (client) client.release();
  }
});

app.get('/api/unique/dest_countries', async (req, res) => {
  let client;
  try {
    client = await pool.connect();
    const query = `
      SELECT DISTINCT pth."country" as value
      FROM public."PingTaskResults" ptr
      INNER JOIN public."PingTestHosts" pth ON ptr."ipAddress" = pth."ipAddress"
      WHERE pth."country" IS NOT NULL
        AND ptr."createdAt" >= NOW() - INTERVAL '1 hour'
      ORDER BY value
    `;
    const result = await client.query(query);
    res.json(result.rows.map(row => row.value));
  } catch (error) {
    logger.error('Error fetching unique dest_countries:', error);
    res.status(500).json({ error: 'Failed to fetch unique destination countries' });
  } finally {
    if (client) client.release();
  }
});

app.get('/api/unique/dest_regions', async (req, res) => {
  let client;
  try {
    client = await pool.connect();
    const query = `
      SELECT DISTINCT pth."region" as value
      FROM public."PingTaskResults" ptr
      INNER JOIN public."PingTestHosts" pth ON ptr."ipAddress" = pth."ipAddress"
      WHERE pth."region" IS NOT NULL
        AND ptr."createdAt" >= NOW() - INTERVAL '1 hour'
      ORDER BY value
    `;
    const result = await client.query(query);
    res.json(result.rows.map(row => row.value));
  } catch (error) {
    logger.error('Error fetching unique dest_regions:', error);
    res.status(500).json({ error: 'Failed to fetch unique destination regions' });
  } finally {
    if (client) client.release();
  }
});

app.get('/api/aggregated-flows', async (req, res) => {
  let client;
  try {
    client = await pool.connect();
    // Increase statement timeout for this query (e.g., 30 seconds)
    await client.query('SET statement_timeout TO 30000');

    const aggQuery = `
      SELECT 
        src_ip."country" AS source_country,
        pth."country" AS dest_country,
        AVG(ptr."avgTime") AS avg_latency,
        COUNT(*) AS volume,
        AVG(li."latitude") AS avg_source_lat,
        AVG(li."longitude") AS avg_source_lon,
        AVG(pth."latitude") AS avg_dest_lat,
        AVG(pth."longitude") AS avg_dest_lon
      FROM public."PingTaskResults" ptr
      INNER JOIN public."PingTestHosts" pth ON ptr."ipAddress" = pth."ipAddress"
      INNER JOIN public."IpInfo" src_ip ON ptr."networkInfoId" = src_ip."networkInfoId"
      LEFT JOIN public."LocationInfo" li ON ptr."networkInfoId" = li."networkInfoId"
      WHERE ptr."createdAt" >= NOW() - INTERVAL '10 hour'
        AND ptr."avgTime" BETWEEN 5 AND 1000
        AND pth."latitude" IS NOT NULL 
        AND pth."longitude" IS NOT NULL
        AND li."latitude" IS NOT NULL
        AND li."longitude" IS NOT NULL
      GROUP BY 
        src_ip."country", 
        pth."country"
      HAVING COUNT(*) >= 10
      ORDER BY volume DESC;
    `;

    const result = await client.query(aggQuery);
    res.json({ flows: result.rows });
  } catch (error) {
    logger.error('Error in /api/aggregated-flows: %o', error);
    res.status(500).json({ error: 'Failed to fetch aggregated flows' });
  } finally {
    if (client) client.release();
  }
});

// Daily aggregated latencies (overview per source country or per-operator for a country)
app.get('/api/daily-latencies', async (req, res) => {
  let client;
  try {
    client = await pool.connect();

    const days = Math.max(1, Math.min(parseInt(req.query.days || '1', 10), 7));
    const country = req.query.country; // ISO code

    // Try to detect an existing pre-aggregated daily table
    const candidateTables = [
      'DailyLatencySummary',
      'DailyLatencies',
      'LatencyDaily',
      'LatencyAggregatesDaily'
    ];

    let dailyTable = null;
    for (const t of candidateTables) {
      const check = await client.query(
        `SELECT 1 FROM information_schema.tables WHERE table_schema='public' AND table_name=$1 LIMIT 1`,
        [t]
      );
      if (check.rowCount > 0) { dailyTable = t; break; }
    }

    // Build queries
    if (!country) {
      // Overview per source country
      let rows;
      if (dailyTable) {
        // Expect columns: day, source_country, avg_latency, total_tests, compliance_rate
        const q = `
          SELECT source_country, 
                 SUM(total_tests) AS total_tests,
                 SUM(avg_latency * total_tests) / NULLIF(SUM(total_tests),0) AS avg_latency,
                 SUM(compliance_rate * total_tests) / NULLIF(SUM(total_tests),0) AS compliance_rate
          FROM public."${dailyTable}"
          WHERE day >= CURRENT_DATE - INTERVAL '${days} day'
          GROUP BY source_country
          HAVING SUM(total_tests) > 0
          ORDER BY total_tests DESC`;
        rows = (await client.query(q)).rows;
      } else {
        // Fallback: aggregate from base tables limited to last N days
        const q = `
          SELECT ptr."countryCode" AS source_country,
                 COUNT(*)::INT AS total_tests,
                 AVG(ptr."avgTime")::FLOAT AS avg_latency,
                 AVG(CASE WHEN ptr."avgTime" <= 300 THEN 1 ELSE 0 END) * 100.0 AS compliance_rate
          FROM public."PingTaskResults" ptr
          INNER JOIN public."PingTestHosts" pth ON ptr."ipAddress" = pth."ipAddress"
          WHERE ptr."createdAt" >= NOW() - INTERVAL '${days} day'
            AND ptr."avgTime" BETWEEN 5 AND 800
            AND pth."latitude" IS NOT NULL AND pth."longitude" IS NOT NULL
            AND ptr."countryCode" IS NOT NULL
          GROUP BY ptr."countryCode"
          HAVING COUNT(*) >= 10
          ORDER BY total_tests DESC`;
        rows = (await client.query(q)).rows;
      }
      return res.json({ overview: rows });
    } else {
      // Per-operator for a given country
      let rows;
      if (dailyTable) {
        // Expect columns: day, source_country, operator, avg_latency, total_tests, compliance_rate
        const q = `
          SELECT operator,
                 SUM(total_tests) AS total_routes,
                 SUM(avg_latency * total_tests) / NULLIF(SUM(total_tests),0) AS avg_latency,
                 SUM(compliance_rate * total_tests) / NULLIF(SUM(total_tests),0) AS compliance_rate
          FROM public."${dailyTable}"
          WHERE day >= CURRENT_DATE - INTERVAL '${days} day'
            AND source_country = $1
            AND operator IS NOT NULL
          GROUP BY operator
          HAVING SUM(total_tests) > 0
          ORDER BY total_routes DESC`;
        rows = (await client.query(q, [country])).rows;
      } else {
        const q = `
          SELECT ptr."operator" AS operator,
                 COUNT(*)::INT AS total_routes,
                 AVG(ptr."avgTime")::FLOAT AS avg_latency,
                 AVG(CASE WHEN ptr."avgTime" <= 300 THEN 1 ELSE 0 END) * 100.0 AS compliance_rate
          FROM public."PingTaskResults" ptr
          INNER JOIN public."PingTestHosts" pth ON ptr."ipAddress" = pth."ipAddress"
          WHERE ptr."createdAt" >= NOW() - INTERVAL '${days} day'
            AND ptr."avgTime" BETWEEN 5 AND 800
            AND pth."latitude" IS NOT NULL AND pth."longitude" IS NOT NULL
            AND ptr."countryCode" = $1
            AND ptr."operator" IS NOT NULL
          GROUP BY ptr."operator"
          HAVING COUNT(*) >= 10
          ORDER BY total_routes DESC`;
        rows = (await client.query(q, [country])).rows;
      }

      // Shape into a compact payload
      const operators = rows.map(r => ({
        name: r.operator,
        totalRoutes: Number(r.total_routes) || 0,
        avgLatency: Math.round(Number(r.avg_latency) || 0),
        complianceRate: Math.round(Number(r.compliance_rate) || 0),
        overallScore: Math.round(((Number(r.compliance_rate) || 0) / Math.max(1, Number(r.avg_latency) || 1)) * 100)
      }));

      return res.json({ country, operators });
    }
  } catch (error) {
    logger.error('Error in /api/daily-latencies: %o', error);
    res.status(500).json({ error: 'Failed to fetch daily aggregated latencies' });
  } finally {
    if (client) client.release();
  }
});

app.get('/api/latest-test', async (req, res) => {
  let client;
  try {
    client = await pool.connect();
    const query = `
      WITH latest_task AS (
        SELECT MAX("taskId") AS latest_task_id FROM public."PingTaskResults"
      )
      SELECT
          ptr."id",
          ptr."networkInfoId",
          ptr."ipAddress",
          ptr."avgTime",
          ptr."createdAt" AS created_at,
          ptr."taskId",
          ptr."hexBin" AS source_hexbin,
          COALESCE(nie."networkType"::TEXT, 'unknown') AS network_type,
          ptr."operator",
          ptr."userId",
          ptr."maxTime",
          ptr."minTime",
          ptr."avgJitter",
          ptr."maxJitter",
          ptr."packetLoss",
          ptr."countryCode" AS source_country,
          ipi."continentCode" AS source_region,
          ipi."organization" as ipinfo_organization,
          ptr."dstAsn",
          ptr."srcAsn",
          pth."latitude" AS dest_latitude,
          pth."longitude" AS dest_longitude,
          pth."country" AS dest_country,
          pth."region" AS dest_region,
          pth."reference" AS dest_reference,
          pth."location" AS dest_location,
          COALESCE(li."latitude", 0) AS source_latitude,
          COALESCE(li."longitude", 0) AS source_longitude
      FROM public."PingTaskResults" ptr
      INNER JOIN public."PingTestHosts" pth ON ptr."ipAddress" = pth."ipAddress"
      LEFT JOIN public."NetworkInfoExtended" nie ON ptr."networkInfoId" = nie."networkInfoId"
      LEFT JOIN public."LocationInfo" li ON ptr."networkInfoId" = li."networkInfoId"
      LEFT JOIN public."IpInfo" ipi ON ptr."networkInfoId" = ipi."networkInfoId"
      JOIN latest_task lt ON ptr."taskId" = lt.latest_task_id
      WHERE ptr."avgTime" >= 5
        AND ptr."avgTime" <= 1000
        AND ptr."networkInfoId" IS NOT NULL
        AND pth."latitude" IS NOT NULL 
        AND pth."longitude" IS NOT NULL;
    `;
    const result = await client.query(query);
    res.json({ tests: result.rows });
  } catch (error) {
    logger.error('Error fetching latest test:', error);
    res.status(500).json({ error: 'Failed to fetch latest test' });
  } finally {
    if (client) client.release();
  }
});

// NQS: Performance metrics (KPIs over a recent window)
app.get('/api/nqs/performance-metrics', async (req, res) => {
  let client;
  try {
    client = await pool.connect();
    const hours = Math.max(1, Math.min(parseInt(req.query.hours || '24', 10), 168));
    const whereWindow = `ptr."createdAt" >= NOW() - INTERVAL '${hours} hour'`;

    const q = `
      WITH base AS (
        SELECT
          ptr."avgTime"           AS latency_ms,
          ptr."avgJitter"         AS jitter_ms,
          ptr."packetLoss"        AS loss_pct,
          COALESCE(nie."networkType"::TEXT, 'unknown') AS network_type
        FROM public."PingTaskResults" ptr
        INNER JOIN public."PingTestHosts" pth ON ptr."ipAddress" = pth."ipAddress"
        LEFT JOIN public."NetworkInfoExtended" nie ON ptr."networkInfoId" = nie."networkInfoId"
        WHERE ${whereWindow}
          AND ptr."avgTime" BETWEEN 5 AND 800
          AND pth."latitude" IS NOT NULL AND pth."longitude" IS NOT NULL
      )
      SELECT
        COUNT(*)::INT                               AS total_tests,
        AVG(latency_ms)::FLOAT                      AS avg_latency,
        PERCENTILE_CONT(0.5) WITHIN GROUP (ORDER BY latency_ms) AS p50_latency,
        PERCENTILE_CONT(0.95) WITHIN GROUP (ORDER BY latency_ms) AS p95_latency,
        AVG(jitter_ms)::FLOAT                       AS avg_jitter,
        AVG(loss_pct)::FLOAT                        AS avg_loss,
        AVG(CASE WHEN latency_ms <= 300 THEN 1 ELSE 0 END) * 100.0 AS compliance_rate
      FROM base`;

    const result = await client.query(q);
    return res.json({ hours, metrics: result.rows?.[0] || null });
  } catch (error) {
    logger.error('Error in /api/nqs/performance-metrics: %o', error);
    res.status(500).json({ error: 'Failed to fetch performance metrics' });
  } finally {
    if (client) client.release();
  }
});

// NQS: Geographic distribution (per-country aggregates)
app.get('/api/nqs/geographic-distribution', async (req, res) => {
  let client;
  try {
    client = await pool.connect();
    const hours = Math.max(1, Math.min(parseInt(req.query.hours || '24', 10), 720));
    const minSamples = Math.max(1, Math.min(parseInt(req.query.min || '10', 10), 10000));
    const whereWindow = `ptr."createdAt" >= NOW() - INTERVAL '${hours} hour'`;

    const q = `
      SELECT 
        ptr."countryCode" AS source_country,
        COUNT(*)::INT      AS total_tests,
        AVG(ptr."avgTime")::FLOAT AS avg_latency,
        AVG(CASE WHEN ptr."avgTime" <= 300 THEN 1 ELSE 0 END) * 100.0 AS compliance_rate,
        AVG(li."latitude")  AS avg_source_lat,
        AVG(li."longitude") AS avg_source_lon
      FROM public."PingTaskResults" ptr
      INNER JOIN public."PingTestHosts" pth ON ptr."ipAddress" = pth."ipAddress"
      LEFT JOIN public."LocationInfo" li ON ptr."networkInfoId" = li."networkInfoId"
      WHERE ${whereWindow}
        AND ptr."avgTime" BETWEEN 5 AND 800
        AND pth."latitude" IS NOT NULL AND pth."longitude" IS NOT NULL
        AND ptr."countryCode" IS NOT NULL
      GROUP BY ptr."countryCode"
      HAVING COUNT(*) >= $1
      ORDER BY total_tests DESC`;

    const result = await client.query(q, [minSamples]);
    return res.json({ hours, minSamples, countries: result.rows });
  } catch (error) {
    logger.error('Error in /api/nqs/geographic-distribution: %o', error);
    res.status(500).json({ error: 'Failed to fetch geographic distribution' });
  } finally {
    if (client) client.release();
  }
});

// NQS: Network performance by type (mobile/wifi/wired/unknown)
app.get('/api/nqs/network-performance', async (req, res) => {
  let client;
  try {
    client = await pool.connect();
    const hours = Math.max(1, Math.min(parseInt(req.query.hours || '24', 10), 720));
    const whereWindow = `ptr."createdAt" >= NOW() - INTERVAL '${hours} hour'`;

    const q = `
      SELECT
        COALESCE(nie."networkType"::TEXT, 'unknown') AS network_type,
        COUNT(*)::INT                                 AS total_tests,
        AVG(ptr."avgTime")::FLOAT                    AS avg_latency,
        PERCENTILE_CONT(0.95) WITHIN GROUP (ORDER BY ptr."avgTime") AS p95_latency,
        AVG(ptr."avgJitter")::FLOAT                  AS avg_jitter,
        AVG(ptr."packetLoss")::FLOAT                 AS avg_loss,
        AVG(CASE WHEN ptr."avgTime" <= 300 THEN 1 ELSE 0 END) * 100.0 AS compliance_rate
      FROM public."PingTaskResults" ptr
      INNER JOIN public."PingTestHosts" pth ON ptr."ipAddress" = pth."ipAddress"
      LEFT JOIN public."NetworkInfoExtended" nie ON ptr."networkInfoId" = nie."networkInfoId"
      WHERE ${whereWindow}
        AND ptr."avgTime" BETWEEN 5 AND 1000
        AND pth."latitude" IS NOT NULL AND pth."longitude" IS NOT NULL
      GROUP BY network_type
      ORDER BY total_tests DESC`;

    const result = await client.query(q);
    return res.json({ hours, byType: result.rows });
  } catch (error) {
    logger.error('Error in /api/nqs/network-performance: %o', error);
    res.status(500).json({ error: 'Failed to fetch network performance by type' });
  } finally {
    if (client) client.release();
  }
});

// NQS: Time series (hourly aggregates)
app.get('/api/nqs/time-series', async (req, res) => {
  let client;
  try {
    client = await pool.connect();
    const hours = Math.max(1, Math.min(parseInt(req.query.hours || '24', 10), 720));
    const whereWindow = `ptr."createdAt" >= NOW() - INTERVAL '${hours} hour'`;

    const q = `
      SELECT
        date_trunc('hour', ptr."createdAt") AS hour,
        COUNT(*)::INT                         AS total_tests,
        AVG(ptr."avgTime")::FLOAT            AS avg_latency,
        PERCENTILE_CONT(0.95) WITHIN GROUP (ORDER BY ptr."avgTime") AS p95_latency,
        AVG(ptr."avgJitter")::FLOAT          AS avg_jitter,
        AVG(ptr."packetLoss")::FLOAT         AS avg_loss,
        AVG(CASE WHEN ptr."avgTime" <= 300 THEN 1 ELSE 0 END) * 100.0 AS compliance_rate
      FROM public."PingTaskResults" ptr
      INNER JOIN public."PingTestHosts" pth ON ptr."ipAddress" = pth."ipAddress"
      WHERE ${whereWindow}
        AND ptr."avgTime" BETWEEN 5 AND 800
        AND pth."latitude" IS NOT NULL AND pth."longitude" IS NOT NULL
      GROUP BY 1
      ORDER BY hour ASC`;

    const result = await client.query(q);
    return res.json({ hours, series: result.rows });
  } catch (error) {
    logger.error('Error in /api/nqs/time-series: %o', error);
    res.status(500).json({ error: 'Failed to fetch time series' });
  } finally {
    if (client) client.release();
  }
});

// NQS: Top performers (best routes by latency)
app.get('/api/nqs/top-performers', async (req, res) => {
  let client;
  try {
    client = await pool.connect();
    const hours = Math.max(1, Math.min(parseInt(req.query.hours || '24', 10), 720));
    const limit = Math.max(1, Math.min(parseInt(req.query.limit || '50', 10), 500));
    const whereWindow = `ptr."createdAt" >= NOW() - INTERVAL '${hours} hour'`;

    const q = `
      SELECT 
        ptr."countryCode" AS source_country,
        pth."country"     AS dest_country,
        COALESCE(nie."networkType"::TEXT, 'unknown') AS network_type,
        ptr."operator"    AS operator,
        AVG(ptr."avgTime")::FLOAT AS avg_latency,
        COUNT(*)::INT      AS samples,
        AVG(CASE WHEN ptr."avgTime" <= 300 THEN 1 ELSE 0 END) * 100.0 AS compliance_rate,
        AVG(li."latitude")  AS avg_source_lat,
        AVG(li."longitude") AS avg_source_lon,
        AVG(pth."latitude") AS avg_dest_lat,
        AVG(pth."longitude") AS avg_dest_lon
      FROM public."PingTaskResults" ptr
      INNER JOIN public."PingTestHosts" pth ON ptr."ipAddress" = pth."ipAddress"
      LEFT JOIN public."NetworkInfoExtended" nie ON ptr."networkInfoId" = nie."networkInfoId"
      LEFT JOIN public."LocationInfo" li ON ptr."networkInfoId" = li."networkInfoId"
      WHERE ${whereWindow}
        AND ptr."avgTime" BETWEEN 5 AND 800
        AND pth."latitude" IS NOT NULL AND pth."longitude" IS NOT NULL
        AND ptr."countryCode" IS NOT NULL
        AND pth."country" IS NOT NULL
      GROUP BY 1,2,3,4
      HAVING COUNT(*) >= 10
      ORDER BY avg_latency ASC, compliance_rate DESC
      LIMIT $1`;

    const result = await client.query(q, [limit]);
    return res.json({ hours, limit, routes: result.rows });
  } catch (error) {
    logger.error('Error in /api/nqs/top-performers: %o', error);
    res.status(500).json({ error: 'Failed to fetch top performers' });
  } finally {
    if (client) client.release();
  }
});

// 24-hour global rankings endpoint
app.get('/api/global-rankings-24h', async (req, res) => {
  let client;
  try {
    client = await pool.connect();

    const query = `
      WITH latest_day AS (
        SELECT MAX(date) AS d
        FROM "DailyLatencySummary"
      ),

      base AS (
        SELECT
          d.date,
          -- normalize operator for de-dup (UNITEL vs Unitel)
          REGEXP_REPLACE(UPPER(TRIM(d.operator)), '\\s+', ' ', 'g') AS operator_name,
          d."ispAsn"               AS src_asn,
          d."networkType",
          d.host,

          -- source ISO2 (fix UK→GB) and country/region
          CASE WHEN UPPER(d."countryCode") = 'UK' THEN 'GB' ELSE UPPER(d."countryCode") END AS src_iso2,

          d."isSameRegion"         AS is_same_region,
          COALESCE(d."sampleCount",0) AS samples,

          -- bucket compliances (for visibility)
          d."less100msCount"::float / NULLIF(d."sampleCount",0)    AS comp_100ms,
          d."less300msCount"::float / NULLIF(d."sampleCount",0)    AS comp_300ms,

          -- region-aware compliance per your rule
          (CASE WHEN d."isSameRegion"
                THEN d."sameRegionCompliantCount"::float
                ELSE d."crossRegionCompliantCount"::float
           END) / NULLIF(d."sampleCount",0) AS latency_compliance_region,

          -- core latency stats
          COALESCE(d."p50Latency",0) AS p50_ms,
          COALESCE(d."p95Latency",0) AS p95_ms,
          COALESCE(d."p99Latency",0) AS p99_ms,
          COALESCE(d."avgLatency",0) AS avg_ms,

          -- loss already 0..100 in table
          COALESCE(d."avgLoss",0)    AS loss_pct,

          -- outliers (if available on daily)
          COALESCE(d."outlierCount"::float / NULLIF(d."sampleCount",0), 0) AS outlier_ratio
        FROM "DailyLatencySummary" d
        JOIN latest_day ld ON d.date = ld.d
      ),

      geo AS (
        SELECT
          b.*,
          dc."name"        AS src_country,
          dc."region"      AS src_region,
          dc."sub-region"  AS src_subregion
        FROM base b
        LEFT JOIN dim_country dc ON dc."alpha-2" = b.src_iso2
      ),

      scored AS (
        SELECT
          g.*,
          -- choose target per SAME/CROSS
          CASE WHEN g.is_same_region THEN 100 ELSE 300 END AS p95_ok_ms,

          -- loss-aware effective compliance (cap by loss)
          LEAST(
            COALESCE(g.latency_compliance_region,0),
            GREATEST(0.0, LEAST(1.0, 1.0 - (g.loss_pct/100.0)))
          ) AS effective_compliance
        FROM geo g
      ),

      classified AS (
        SELECT
          s.*,
          -- primary severity
          CASE
            WHEN samples < 1 THEN 'NO_DATA'
            WHEN p99_ms > 1000 OR effective_compliance < 0.50 THEN 'CRITICAL'
            WHEN p95_ms > p95_ok_ms OR p99_ms > 500 OR effective_compliance < 0.70 THEN 'MAJOR'
            WHEN effective_compliance >= 0.99
                 AND p95_ms <= p95_ok_ms AND p99_ms <= 500
                 AND loss_pct <= 2 AND outlier_ratio <= 0.05 THEN 'OK'
            WHEN (p95_ms >= CASE WHEN is_same_region THEN 150 ELSE 200 END)
                 OR effective_compliance < 0.90
                 OR outlier_ratio > 0.05
                 OR loss_pct > 2 THEN 'WARNING'
            ELSE 'OK'
          END AS severity,

          -- leading issue reason (human label)
          CASE
            WHEN p99_ms > 1000 THEN 'LATENCY_1000+'
            WHEN p99_ms > 500  THEN 'LATENCY_500+'
            WHEN p95_ms > p95_ok_ms THEN CASE WHEN is_same_region THEN 'LATENCY_P95>100' ELSE 'LATENCY_P95>300' END
            WHEN effective_compliance < 0.50 THEN 'COMPLIANCE<<'
            WHEN effective_compliance < 0.70 THEN 'COMPLIANCE<'
            WHEN loss_pct > 5 THEN 'PACKET_LOSS_5%+'
            WHEN outlier_ratio > 0.10 THEN 'OUTLIERS_SPIKE'
            WHEN outlier_ratio > 0.05 THEN 'OUTLIERS_ELEVATED'
            ELSE 'OK'
          END AS issue_type
        FROM scored s
      )

      SELECT
        date,
        src_iso2, src_country, src_region, src_subregion,
        operator_name, src_asn, "networkType",
        is_same_region,
        samples,
        ROUND((comp_100ms*100)::numeric,2)           AS comp_100ms_pct,
        ROUND((comp_300ms*100)::numeric,2)           AS comp_300ms_pct,
        ROUND((effective_compliance*100)::numeric,2) AS eff_compliance_pct,
        ROUND(p50_ms::numeric,2) AS p50_ms,
        ROUND(p95_ms::numeric,2) AS p95_ms,
        ROUND(p99_ms::numeric,2) AS p99_ms,
        ROUND(avg_ms::numeric,2) AS avg_ms,
        ROUND(loss_pct::numeric,2) AS loss_pct,
        ROUND((outlier_ratio*100)::numeric,2) AS outlier_pct,
        severity,
        issue_type,
        -- per-country & access-type ranking (worst first by P95 gap to target)
        DENSE_RANK() OVER (
          PARTITION BY src_iso2, "networkType"
          ORDER BY (p95_ms - p95_ok_ms) DESC, (100 - effective_compliance) DESC, loss_pct DESC
        ) AS rank_worst
      FROM classified
      ORDER BY severity DESC, (p95_ms - p95_ok_ms) DESC, (100 - effective_compliance) DESC, loss_pct DESC
      LIMIT 100
    `;

    const result = await client.query(query);
    res.json({
      success: true,
      rankings: result.rows,
      total: result.rows.length
    });
  } catch (error) {
    logger.error('Error fetching 24h global rankings:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch 24-hour global rankings',
      message: process.env.NODE_ENV === 'development' ? error.message : 'Database query failed.'
    });
  } finally {
    if (client) client.release();
  }
});

// Last 3 hours issues endpoint
app.get('/api/hourly-issues', async (req, res) => {
  let client;
  try {
    client = await pool.connect();

    const query = `
      WITH time_window AS (
        SELECT date_trunc('hour', now()) - interval '3 hours' AS start_ts
      ),
      base AS (
        SELECT
          h.hour,
          REGEXP_REPLACE(UPPER(TRIM(h.operator)), '\\s+', ' ', 'g') AS operator_name,
          h."ispAsn"           AS src_asn,
          h."networkType",
          CASE WHEN UPPER(h."countryCode")='UK' THEN 'GB' ELSE UPPER(h."countryCode") END AS src_iso2,

          h."isSameRegion"     AS is_same_region,
          COALESCE(h."sampleCount",0) AS samples,

          -- bucket compliances
          h."less100msCount"::float / NULLIF(h."sampleCount",0) AS comp_100ms,
          h."less300msCount"::float / NULLIF(h."sampleCount",0) AS comp_300ms,

          -- region-aware compliance
          (CASE WHEN h."isSameRegion"
                THEN h."sameRegionCompliantCount"::float
                ELSE h."crossRegionCompliantCount"::float
           END) / NULLIF(h."sampleCount",0) AS latency_compliance_region,

          -- latency stats
          COALESCE(h."p50Latency",0) AS p50_ms,
          COALESCE(h."p95Latency",0) AS p95_ms,
          COALESCE(h."p99Latency",0) AS p99_ms,
          COALESCE(h."avgLatency",0) AS avg_ms,

          -- quality
          COALESCE(h."avgPacketLoss", h."avgLoss") AS loss_pct,  -- already in %
          COALESCE(h."outlierCount"::float / NULLIF(h."sampleCount",0), 0) AS outlier_ratio
        FROM "HourlyLatencyAggregate" h
        JOIN time_window w ON h.hour >= w.start_ts
      ),

      geo AS (
        SELECT
          b.*,
          dc."name"       AS src_country,
          dc."region"     AS src_region,
          dc."sub-region" AS src_subregion
        FROM base b
        LEFT JOIN dim_country dc ON dc."alpha-2" = b.src_iso2
      ),

      scored AS (
        SELECT
          g.*,
          CASE WHEN g.is_same_region THEN 100 ELSE 300 END AS p95_ok_ms,
          LEAST(
            COALESCE(g.latency_compliance_region,0),
            CASE WHEN g.loss_pct IS NULL THEN 1.0
                 ELSE GREATEST(0.0, LEAST(1.0, 1.0 - (g.loss_pct/100.0))) END
          ) AS effective_compliance
        FROM geo g
      ),

      classified AS (
        SELECT
          s.*,
          CASE
            WHEN samples < 1 THEN 'NO_DATA'
            WHEN p99_ms > 1000 OR effective_compliance < 0.50 THEN 'CRITICAL'
            WHEN p95_ms > p95_ok_ms OR p99_ms > 500 OR effective_compliance < 0.70 THEN 'MAJOR'
            WHEN effective_compliance >= 0.99
                 AND p95_ms <= p95_ok_ms AND p99_ms <= 500
                 AND (loss_pct IS NULL OR loss_pct <= 2)
                 AND outlier_ratio <= 0.05 THEN 'OK'
            WHEN (p95_ms >= CASE WHEN is_same_region THEN 150 ELSE 200 END)
                 OR effective_compliance < 0.90
                 OR outlier_ratio > 0.05
                 OR (loss_pct IS NOT NULL AND loss_pct > 2) THEN 'WARNING'
            ELSE 'OK'
          END AS severity,
          CASE
            WHEN p99_ms > 1000 THEN 'LATENCY_1000+'
            WHEN p99_ms > 500  THEN 'LATENCY_500+'
            WHEN p95_ms > p95_ok_ms THEN CASE WHEN is_same_region THEN 'LATENCY_P95>100' ELSE 'LATENCY_P95>300' END
            WHEN effective_compliance < 0.50 THEN 'COMPLIANCE<<'
            WHEN effective_compliance < 0.70 THEN 'COMPLIANCE<'
            WHEN loss_pct > 5 THEN 'PACKET_LOSS_5%+'
            WHEN outlier_ratio > 0.10 THEN 'OUTLIERS_SPIKE'
            WHEN outlier_ratio > 0.05 THEN 'OUTLIERS_ELEVATED'
            ELSE 'OK'
          END AS issue_type
        FROM scored s
      )

      SELECT
        hour,
        src_iso2, src_country, src_region, src_subregion,
        operator_name, src_asn, "networkType",
        is_same_region,
        samples,
        ROUND((comp_100ms*100)::numeric,2)           AS comp_100ms_pct,
        ROUND((comp_300ms*100)::numeric,2)           AS comp_300ms_pct,
        ROUND((effective_compliance*100)::numeric,2) AS eff_compliance_pct,
        ROUND(p50_ms::numeric,2) AS p50_ms,
        ROUND(p95_ms::numeric,2) AS p95_ms,
        ROUND(p99_ms::numeric,2) AS p99_ms,
        ROUND(avg_ms::numeric,2) AS avg_ms,
        CASE WHEN loss_pct IS NULL THEN NULL ELSE ROUND(loss_pct::numeric,2) END AS loss_pct,
        ROUND((outlier_ratio*100)::numeric,2) AS outlier_pct,
        severity,
        issue_type
      FROM classified
      WHERE severity IN ('WARNING','MAJOR','CRITICAL')  -- issues only
      ORDER BY severity DESC, (p95_ms - p95_ok_ms) DESC, (100 - effective_compliance) DESC, loss_pct DESC, hour DESC
      LIMIT 50
    `;

    const result = await client.query(query);
    res.json({
      success: true,
      issues: result.rows,
      total: result.rows.length
    });
  } catch (error) {
    logger.error('Error fetching hourly issues:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch hourly issues',
      message: process.env.NODE_ENV === 'development' ? error.message : 'Database query failed.'
    });
  } finally {
    if (client) client.release();
  }
});

// High-latency analysis endpoint (24h focus on >300ms links)
app.get('/api/high-latency-24h', async (req, res) => {
  let client;
  try {
    client = await pool.connect();

    const query = `
      WITH latest_day AS (
        SELECT MAX(date) AS d
        FROM "DailyLatencySummary"
      ),

      base AS (
        SELECT
          d.date,
          REGEXP_REPLACE(UPPER(TRIM(d.operator)), '\\s+', ' ', 'g') AS operator_name,
          d."ispAsn"               AS src_asn,
          d."networkType",
          CASE WHEN UPPER(d."countryCode") = 'UK' THEN 'GB' ELSE UPPER(d."countryCode") END AS src_iso2,
          d."isSameRegion"         AS is_same_region,
          COALESCE(d."sampleCount",0) AS samples,
          COALESCE(d."p50Latency",0) AS p50_ms,
          COALESCE(d."p95Latency",0) AS p95_ms,
          COALESCE(d."p99Latency",0) AS p99_ms,
          COALESCE(d."avgLatency",0) AS avg_ms,
          COALESCE(d."avgLoss",0)    AS loss_pct,

          -- Count of links over thresholds
          (d."sampleCount" - COALESCE(d."less100msCount",0))::int AS links_over_100ms,
          (d."sampleCount" - COALESCE(d."less300msCount",0))::int AS links_over_300ms,
          CASE WHEN d."p95Latency" > 500 THEN 1 ELSE 0 END AS has_500ms_plus,
          CASE WHEN d."p99Latency" > 1000 THEN 1 ELSE 0 END AS has_1000ms_plus
        FROM "DailyLatencySummary" d
        JOIN latest_day ld ON d.date = ld.d
        -- Only include records with links over 300ms
        HAVING (d."sampleCount" - COALESCE(d."less300msCount",0)) > 0
      ),

      geo AS (
        SELECT
          b.*,
          dc."name"        AS src_country,
          dc."region"      AS src_region,
          dc."sub-region"  AS src_subregion
        FROM base b
        LEFT JOIN dim_country dc ON dc."alpha-2" = b.src_iso2
      ),

      high_latency_focus AS (
        SELECT
          *,
          CASE
            WHEN p99_ms > 1000 THEN 'CRITICAL_1000+'
            WHEN p95_ms > 500 THEN 'MAJOR_500+'
            WHEN links_over_300ms > 0 THEN 'HIGH_LATENCY_300+'
            ELSE 'UNKNOWN'
          END AS latency_severity
        FROM geo
      )

      SELECT
        date,
        src_iso2, src_country, src_region, src_subregion,
        operator_name, src_asn, "networkType",
        is_same_region,
        samples,
        ROUND(p50_ms::numeric,2) AS p50_ms,
        ROUND(p95_ms::numeric,2) AS p95_ms,
        ROUND(p99_ms::numeric,2) AS p99_ms,
        ROUND(avg_ms::numeric,2) AS avg_ms,
        ROUND(loss_pct::numeric,2) AS loss_pct,
        links_over_100ms,
        links_over_300ms,
        has_500ms_plus,
        has_1000ms_plus,
        latency_severity,

        -- Ranking by severity and latency
        DENSE_RANK() OVER (
          PARTITION BY latency_severity
          ORDER BY p95_ms DESC, links_over_300ms DESC, loss_pct DESC
        ) AS severity_rank
      FROM high_latency_focus
      ORDER BY
        CASE latency_severity
          WHEN 'CRITICAL_1000+' THEN 1
          WHEN 'MAJOR_500+' THEN 2
          WHEN 'HIGH_LATENCY_300+' THEN 3
          ELSE 4
        END,
        p95_ms DESC,
        links_over_300ms DESC
      LIMIT 200
    `;

    const result = await client.query(query);

    // Group by country and operator for summary
    const countrySummary = {};
    const operatorSummary = {};

    result.rows.forEach(row => {
      // Country summary
      if (!countrySummary[row.src_country]) {
        countrySummary[row.src_country] = {
          country: row.src_country,
          region: row.src_region,
          operators: 0,
          total_links_300ms: 0,
          links_500ms_plus: 0,
          links_1000ms_plus: 0,
          worst_p95: 0,
          operators_affected: new Set()
        };
      }
      countrySummary[row.src_country].operators++;
      countrySummary[row.src_country].total_links_300ms += row.links_over_300ms;
      if (row.has_500ms_plus) countrySummary[row.src_country].links_500ms_plus++;
      if (row.has_1000ms_plus) countrySummary[row.src_country].links_1000ms_plus++;
      countrySummary[row.src_country].worst_p95 = Math.max(countrySummary[row.src_country].worst_p95, row.p95_ms);
      countrySummary[row.src_country].operators_affected.add(row.operator_name);

      // Operator summary
      if (!operatorSummary[row.operator_name]) {
        operatorSummary[row.operator_name] = {
          operator: row.operator_name,
          country: row.src_country,
          total_links_300ms: 0,
          links_500ms_plus: 0,
          links_1000ms_plus: 0,
          worst_p95: 0,
          countries_affected: new Set()
        };
      }
      operatorSummary[row.operator_name].total_links_300ms += row.links_over_300ms;
      if (row.has_500ms_plus) operatorSummary[row.operator_name].links_500ms_plus++;
      if (row.has_1000ms_plus) operatorSummary[row.operator_name].links_1000ms_plus++;
      operatorSummary[row.operator_name].worst_p95 = Math.max(operatorSummary[row.operator_name].worst_p95, row.p95_ms);
      operatorSummary[row.operator_name].countries_affected.add(row.src_country);
    });

    // Convert Sets to counts and arrays
    Object.values(countrySummary).forEach(country => {
      country.operators_affected = country.operators_affected.size;
    });

    Object.values(operatorSummary).forEach(operator => {
      operator.countries_affected = operator.countries_affected.size;
    });

    res.json({
      success: true,
      total_high_latency_records: result.rows.length,
      countries: Object.values(countrySummary).sort((a, b) => b.total_links_300ms - a.total_links_300ms),
      operators: Object.values(operatorSummary).sort((a, b) => b.total_links_300ms - a.total_links_300ms),
      detailed_records: result.rows
    });
  } catch (error) {
    logger.error('Error fetching high-latency 24h analysis:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch high-latency analysis',
      message: process.env.NODE_ENV === 'development' ? error.message : 'Database query failed.'
    });
  } finally {
    if (client) client.release();
  }
});

app.use((err, req, res, next) => {
  logger.error('Unhandled error: %o', err);
  res.status(500).json({
    success: false,
    error: 'Internal server error',
    message: process.env.NODE_ENV === 'development' ? err.message : 'An unexpected error occurred.',
  });
});

const startServerOnPort = (portToUse) => {
  return new Promise((resolve, reject) => {
    const server = app.listen(portToUse, '0.0.0.0')
      .on('error', reject)
      .on('listening', () => {
        logger.info(`🚀 Server running in ${process.env.NODE_ENV || 'development'} mode on port ${portToUse}`);
        resolve(server);
      });
  });
};

const setupShutdownHandlers = (server) => {
  const shutdown = async (signal) => {
    logger.info(`\n${signal} received. Shutting down gracefully...`);
    
    server.close(() => {
      logger.info('✅ HTTP server closed');
      pool.end()
        .then(() => {
          logger.info('✅ Database pool closed');
          process.exit(0);
        })
        .catch(err => {
          logger.error('Error closing database pool: %o', err);
          process.exit(1);
        });
    });
  };

  process.on('SIGTERM', () => shutdown('SIGTERM'));
  process.on('SIGINT', () => shutdown('SIGINT'));
  
  process.on('unhandledRejection', (err) => {
    logger.error('Unhandled Rejection: %o', err);
    if (process.env.NODE_ENV === 'production') {
      shutdown('unhandledRejection');
    }
  });
};

const startServer = async () => {
  try {
    await testConnection();
    
    let server;
    let currentPort = port;
    
    while (true) {
      try {
        server = await startServerOnPort(currentPort);
        break;
      } catch (err) {
        if (err.code === 'EADDRINUSE') {
          logger.warn(`Port ${currentPort} is in use, trying port ${currentPort + 1}...`);
          currentPort++;
          continue;
        }
        throw err;
      }
    }
    
    setupShutdownHandlers(server);
    
    return server;
  } catch (error) {
    logger.error('Failed to start server: %o', error);
    process.exit(1);
  }
};

startServer();
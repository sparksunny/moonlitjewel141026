import express, { Request, Response } from 'express';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;
const DATA_DIR = path.resolve(__dirname, 'data');
const CATALOG_FILE = path.resolve(DATA_DIR, 'catalog.json');

// Body parser
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

interface CatalogData {
  lastUpdated: number;
  products: any[];
  content: any;
  inquiries: any[];
}

// In-memory catalog state for instant responses
let catalogState: CatalogData = {
  lastUpdated: Date.now(),
  products: [],
  content: null,
  inquiries: []
};

// SSE connected clients
const sseClients: Set<Response> = new Set();

function broadcastEvent(type: string, payload: any) {
  const data = JSON.stringify({ type, timestamp: Date.now(), ...payload });
  const message = `event: message\ndata: ${data}\n\n`;
  for (const client of sseClients) {
    try {
      client.write(message);
    } catch (e) {
      sseClients.delete(client);
    }
  }
}

// Helper: atomic write to disk
function persistCatalogToDisk() {
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    const tmpFile = `${CATALOG_FILE}.tmp.${Date.now()}`;
    fs.writeFileSync(tmpFile, JSON.stringify(catalogState, null, 2), 'utf-8');
    fs.renameSync(tmpFile, CATALOG_FILE);
  } catch (error) {
    console.error('Failed to write catalog.json to disk:', error);
  }
}

// Initialize catalog state on server startup
async function initCatalog() {
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }

    if (fs.existsSync(CATALOG_FILE)) {
      const raw = fs.readFileSync(CATALOG_FILE, 'utf-8');
      const parsed = JSON.parse(raw);
      catalogState = {
        lastUpdated: parsed.lastUpdated || Date.now(),
        products: Array.isArray(parsed.products) ? parsed.products : [],
        content: parsed.content || null,
        inquiries: Array.isArray(parsed.inquiries) ? parsed.inquiries : []
      };
      console.log(`Loaded ${catalogState.products.length} products from disk.`);
    } else {
      // Dynamic import initial baseline data if catalog.json does not exist yet
      try {
        const { INITIAL_PRODUCTS } = await import('./src/data/initialProducts.js' as any).catch(async () => {
          return await import('./src/data/initialProducts.ts' as any);
        });
        const { INITIAL_SITE_CONTENT } = await import('./src/data/initialContent.js' as any).catch(async () => {
          return await import('./src/data/initialContent.ts' as any);
        });

        catalogState = {
          lastUpdated: Date.now(),
          products: INITIAL_PRODUCTS || [],
          content: INITIAL_SITE_CONTENT || null,
          inquiries: []
        };
        persistCatalogToDisk();
        console.log(`Initialized disk catalog with ${catalogState.products.length} default products.`);
      } catch (err) {
        console.warn('Could not import initialProducts directly, using empty fallback:', err);
      }
    }
  } catch (err) {
    console.error('Error during catalog initialization:', err);
  }
}

// --------------------- API ROUTES ---------------------

// Health check
app.get('/api/health', (_req: Request, res: Response) => {
  res.json({
    status: 'ok',
    uptime: process.uptime(),
    timestamp: Date.now(),
    productsCount: catalogState.products.length,
    lastUpdated: catalogState.lastUpdated
  });
});

// Lightweight version check for client polling
app.get('/api/catalog/version', (_req: Request, res: Response) => {
  res.json({
    lastUpdated: catalogState.lastUpdated,
    productsCount: catalogState.products.length
  });
});

// Full catalog fetch
app.get('/api/catalog', (_req: Request, res: Response) => {
  res.json({
    lastUpdated: catalogState.lastUpdated,
    products: catalogState.products,
    content: catalogState.content
  });
});

// Real-time Server-Sent Events (SSE) stream
app.get('/api/catalog/events', (req: Request, res: Response) => {
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache, no-transform');
  res.setHeader('Connection', 'keep-alive');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.flushHeaders?.();

  // Send initial handshake
  res.write(`data: ${JSON.stringify({ type: 'connected', lastUpdated: catalogState.lastUpdated })}\n\n`);
  sseClients.add(res);

  // Keep-alive heartbeat every 20 seconds
  const heartbeat = setInterval(() => {
    try {
      res.write(': keepalive\n\n');
    } catch {
      clearInterval(heartbeat);
      sseClients.delete(res);
    }
  }, 20000);

  req.on('close', () => {
    clearInterval(heartbeat);
    sseClients.delete(res);
  });
});

// Save or update single product
app.post('/api/catalog/product', (req: Request, res: Response) => {
  try {
    const product = req.body;
    if (!product || !product.id) {
      return res.status(400).json({ error: 'Invalid product payload. Product id is required.' });
    }

    const idx = catalogState.products.findIndex((p) => p.id === product.id);
    if (idx >= 0) {
      catalogState.products[idx] = { ...product, updatedAt: Date.now() };
    } else {
      catalogState.products.unshift({ ...product, updatedAt: Date.now() });
    }

    catalogState.lastUpdated = Date.now();
    persistCatalogToDisk();
    broadcastEvent('product_saved', { product, lastUpdated: catalogState.lastUpdated });

    res.json({ success: true, product, lastUpdated: catalogState.lastUpdated });
  } catch (error: any) {
    console.error('Error saving product:', error);
    res.status(500).json({ error: error?.message || 'Server error saving product' });
  }
});

// Save all products (bulk update / reorder / additions)
app.post('/api/catalog/products', (req: Request, res: Response) => {
  try {
    const { products } = req.body;
    if (!Array.isArray(products)) {
      return res.status(400).json({ error: 'Products array is required.' });
    }

    catalogState.products = products.map((p) => ({
      ...p,
      updatedAt: p.updatedAt || Date.now()
    }));
    catalogState.lastUpdated = Date.now();
    persistCatalogToDisk();
    broadcastEvent('products_replaced', {
      count: catalogState.products.length,
      lastUpdated: catalogState.lastUpdated
    });

    res.json({
      success: true,
      count: catalogState.products.length,
      lastUpdated: catalogState.lastUpdated
    });
  } catch (error: any) {
    console.error('Error saving products batch:', error);
    res.status(500).json({ error: error?.message || 'Server error saving products' });
  }
});

// Delete a product
app.delete('/api/catalog/product/:id', (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    catalogState.products = catalogState.products.filter((p) => p.id !== id);
    catalogState.lastUpdated = Date.now();
    persistCatalogToDisk();
    broadcastEvent('product_deleted', { id, lastUpdated: catalogState.lastUpdated });

    res.json({ success: true, id, lastUpdated: catalogState.lastUpdated });
  } catch (error: any) {
    console.error('Error deleting product:', error);
    res.status(500).json({ error: error?.message || 'Server error deleting product' });
  }
});

// Update site content & branding
app.post('/api/catalog/content', (req: Request, res: Response) => {
  try {
    const { content } = req.body;
    if (!content) {
      return res.status(400).json({ error: 'Content payload is required.' });
    }

    catalogState.content = content;
    catalogState.lastUpdated = Date.now();
    persistCatalogToDisk();
    broadcastEvent('content_updated', { content, lastUpdated: catalogState.lastUpdated });

    res.json({ success: true, lastUpdated: catalogState.lastUpdated });
  } catch (error: any) {
    console.error('Error saving site content:', error);
    res.status(500).json({ error: error?.message || 'Server error saving content' });
  }
});

// Inquiries list
app.get('/api/inquiries', (_req: Request, res: Response) => {
  res.json({ inquiries: catalogState.inquiries });
});

// Submit customer inquiry
app.post('/api/inquiries', (req: Request, res: Response) => {
  try {
    const inquiry = req.body;
    if (!inquiry || !inquiry.id) {
      return res.status(400).json({ error: 'Inquiry is required.' });
    }

    catalogState.inquiries.unshift(inquiry);
    persistCatalogToDisk();
    broadcastEvent('inquiry_received', { inquiry });

    res.json({ success: true, inquiry });
  } catch (error: any) {
    console.error('Error saving inquiry:', error);
    res.status(500).json({ error: error?.message || 'Server error saving inquiry' });
  }
});

// --------------------- VITE OR STATIC SERVING ---------------------

async function startServer() {
  await initCatalog();

  const isProduction = process.env.NODE_ENV === 'production';

  if (!isProduction) {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true, port: PORT, host: '0.0.0.0' },
      appType: 'spa'
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.resolve(__dirname, 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req: Request, res: Response) => {
      res.sendFile(path.resolve(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Moonlit Luxury Jewelry Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('Fatal error starting server:', err);
  process.exit(1);
});

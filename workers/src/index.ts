/**
 * Shoffer API - Cloudflare Workers (Hono)
 * Main entry point
 */

import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { logger } from 'hono/logger';
import { prettyJSON } from 'hono/pretty-json';

// Route imports
import authRoutes from './routes/auth';
import ridesRoutes from './routes/rides';
import bookingsRoutes from './routes/bookings';
import chatRoutes from './routes/chat';
import usersRoutes from './routes/users';
import adminRoutes from './routes/admin';
import configRoutes from './routes/config';
import vehicleRoutes from './routes/vehicles';

// Durable Object exports
export { ChatRoom } from './durable-objects/ChatRoom';
export { BookingSession } from './durable-objects/BookingSession';

// Environment bindings type
export interface Env {
    DB: D1Database;
    KV: KVNamespace;
    UPLOADS: R2Bucket;
    CHAT: DurableObjectNamespace;
    BOOKING: DurableObjectNamespace;

    // Secrets
    JWT_SECRET: string;
    GOOGLE_CLIENT_SECRET?: string;
    TURNSTILE_SECRET_KEY: string;
    SMS_PROVIDER_API_KEY?: string;

    // Config
    ENVIRONMENT: string;
}

// Variables type for c.set/c.get
export interface Variables {
    requestId: string;
    userId: string;
    isAdmin: boolean;
}

const app = new Hono<{ Bindings: Env, Variables: Variables }>();

// ============================================
// MIDDLEWARE
// ============================================

// CORS
app.use('/*', cors({
    origin: ['http://localhost:3000', 'http://localhost:3001', 'https://shoffer.ir'],
    credentials: true,
}));

// Logger
// app.use('/*', logger()); // Temporarily disabled for cleaner logs

// Pretty JSON
app.use('/*', prettyJSON());

// Request ID middleware (Fixed type)
app.use('/*', async (c, next) => {
    const requestId = crypto.randomUUID();
    c.set('requestId', requestId);
    await next();
});

// ============================================
// ROUTES
// ============================================

app.get('/', (c) => {
    return c.json({
        name: 'Shoffer API',
        version: '1.0.0',
        status: 'operational',
        timestamp: Date.now(),
    });
});

// Health check
app.get('/health', async (c) => {
    try {
        // Test DB connection
        const result = await c.env.DB.prepare('SELECT 1 as test').first();

        return c.json({
            status: 'healthy',
            database: result ? 'connected' : 'error',
            timestamp: Date.now(),
        });
    } catch (error) {
        return c.json({
            status: 'unhealthy',
            error: error instanceof Error ? error.message : 'Unknown error',
        }, 500);
    }
});

// Mount route modules
app.route('/auth', authRoutes);
app.route('/rides', ridesRoutes);
app.route('/bookings', bookingsRoutes);
app.route('/chat', chatRoutes);
app.route('/users', usersRoutes);
app.route('/admin', adminRoutes);
app.route('/config', configRoutes);
app.route('/vehicles', vehicleRoutes);

// ============================================
// ERROR HANDLING
// ============================================

app.onError((err, c) => {
    console.error('Error:', err);

    return c.json({
        success: false,
        error: c.env.ENVIRONMENT === 'production'
            ? 'Internal server error'
            : err.message,
        requestId: c.get('requestId'),
    }, 500);
});

// 404 handler
app.notFound((c) => {
    return c.json({
        success: false,
        error: 'Not found',
        path: c.req.path,
    }, 404);
});

export default app;

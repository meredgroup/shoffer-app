/**
 * Rides Routes
 * Search, create, update, manage rides
 */

import { Hono } from 'hono';
import { zValidator } from '@hono/zod-validator';
import { z } from 'zod';
import { nanoid } from 'nanoid';
import type { Env, Variables } from '../index';
import { authMiddleware, driverMiddleware } from '../middleware/auth';

const rides = new Hono<{ Bindings: Env, Variables: Variables }>();

// ============================================
// SCHEMAS
// ============================================

const createRideSchema = z.object({
    vehicle_id: z.string(),
    origin_city: z.string().min(2),
    origin_address: z.string().min(5),
    origin_lat: z.string().optional(),
    origin_lng: z.string().optional(),
    destination_city: z.string().min(2),
    destination_address: z.string().min(5),
    destination_lat: z.string().optional(),
    destination_lng: z.string().optional(),
    departure_time: z.number(),
    price_per_seat: z.number().min(0),
    total_seats: z.number().min(1).max(8),
    women_only: z.boolean().optional(),
    pets_allowed: z.boolean().optional(),
    smoking_allowed: z.boolean().optional(),
    notes: z.string().optional(),
});

// ============================================
// SEARCH RIDES
// ============================================

rides.get('/search', async (c) => {
    try {
        const { origin_city, destination_city, date, min_seats, max_price, women_only } = c.req.query();

        let query = `
      SELECT r.*, u.full_name as driver_name, u.avatar_url as driver_avatar, 
             u.rating as driver_rating, v.make, v.model, v.color
      FROM rides r
      JOIN users u ON r.driver_id = u.id
      JOIN vehicles v ON r.vehicle_id = v.id
      WHERE r.status = 'active' AND r.available_seats > 0
    `;

        const params: any[] = [];

        if (origin_city) {
            query += ` AND r.origin_city LIKE ?`;
            params.push(`%${origin_city}%`);
        }

        if (destination_city) {
            query += ` AND r.destination_city LIKE ?`;
            params.push(`%${destination_city}%`);
        }

        if (date) {
            const startOfDay = new Date(date).setHours(0, 0, 0, 0) / 1000;
            const endOfDay = new Date(date).setHours(23, 59, 59, 999) / 1000;
            query += ` AND r.departure_time >= ? AND r.departure_time <= ?`;
            params.push(startOfDay, endOfDay);
        }

        if (min_seats) {
            query += ` AND r.available_seats >= ?`;
            params.push(parseInt(min_seats));
        }

        if (max_price) {
            query += ` AND r.price_per_seat <= ?`;
            params.push(parseInt(max_price));
        }

        if (women_only === 'true') {
            query += ` AND r.women_only = 1`;
        }

        query += ` ORDER BY r.departure_time ASC LIMIT 50`;

        const stmt = c.env.DB.prepare(query);
        const results = await stmt.bind(...params).all();

        return c.json({
            success: true,
            data: results.results,
            total: results.results.length,
        });

    } catch (error) {
        console.error('Search rides error:', error);
        return c.json({ success: false, error: 'خطا در جستجوی سفرها' }, 500);
    }
});

// ============================================
// GET SINGLE RIDE
// ============================================

rides.get('/:rideId', async (c) => {
    try {
        const { rideId } = c.req.param();

        const ride = await c.env.DB.prepare(`
      SELECT r.*, 
             u.id as driver_id, u.full_name as driver_name, u.avatar_url as driver_avatar,
             u.rating as driver_rating, u.total_ratings as driver_total_ratings,
             v.make, v.model, v.color, v.year, v.license_plate
      FROM rides r
      JOIN users u ON r.driver_id = u.id
      JOIN vehicles v ON r.vehicle_id = v.id
      WHERE r.id = ? OR r.slug = ?
    `).bind(rideId, rideId).first();

        if (!ride) {
            return c.json({ success: false, error: 'سفر یافت نشد' }, 404);
        }

        return c.json({ success: true, data: ride });

    } catch (error) {
        console.error('Get ride error:', error);
        return c.json({ success: false, error: 'خطا در دریافت اطلاعات سفر' }, 500);
    }
});

// ============================================
// CREATE RIDE (Driver only)
// ============================================

rides.post('/', authMiddleware, driverMiddleware, zValidator('json', createRideSchema), async (c) => {
    try {
        const userId = c.get('userId');
        const data = c.req.valid('json');
        const db = c.env.DB;

        // Verify vehicle belongs to driver
        const vehicle = await db.prepare(
            'SELECT id FROM vehicles WHERE id = ? AND user_id = ? AND is_active = 1'
        ).bind(data.vehicle_id, userId).first();

        if (!vehicle) {
            return c.json({ success: false, error: 'وسیله نقلیه یافت نشد' }, 404);
        }

        // Validate departure time is in future
        const now = Math.floor(Date.now() / 1000);
        if (data.departure_time <= now) {
            return c.json({ success: false, error: 'زمان حرکت باید در آینده باشد' }, 400);
        }

        const rideId = nanoid();
        const slug = generateRideSlug(data.origin_city, data.destination_city, rideId.slice(0, 6));

        await db.prepare(`
      INSERT INTO rides (
        id, driver_id, vehicle_id, 
        origin_city, origin_address, origin_lat, origin_lng,
        destination_city, destination_address, destination_lat, destination_lng,
        departure_time, price_per_seat, total_seats, available_seats,
        women_only, pets_allowed, smoking_allowed, notes, slug, status,
        created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'active', ?, ?)
    `).bind(
            rideId,
            userId,
            data.vehicle_id,
            data.origin_city,
            data.origin_address,
            data.origin_lat || null,
            data.origin_lng || null,
            data.destination_city,
            data.destination_address,
            data.destination_lat || null,
            data.destination_lng || null,
            data.departure_time,
            data.price_per_seat,
            data.total_seats,
            data.total_seats, // available_seats initially equals total_seats
            data.women_only ? 1 : 0,
            data.pets_allowed ? 1 : 0,
            data.smoking_allowed ? 1 : 0,
            data.notes || null,
            slug,
            now,
            now
        ).run();

        // TODO: Notify followers of this driver about new ride

        return c.json({
            success: true,
            data: { ride_id: rideId, slug },
            message: 'سفر با موفقیت ایجاد شد',
        }, 201);

    } catch (error) {
        console.error('Create ride error:', error);
        return c.json({ success: false, error: 'خطا در ایجاد سفر' }, 500);
    }
});

// ============================================
// UPDATE RIDE
// ============================================

rides.put('/:rideId', authMiddleware, driverMiddleware, async (c) => {
    try {
        const userId = c.get('userId');
        const { rideId } = c.req.param();
        const data = await c.req.json();
        const db = c.env.DB;

        // Verify ride belongs to driver
        const ride = await db.prepare(
            'SELECT id FROM rides WHERE id = ? AND driver_id = ?'
        ).bind(rideId, userId).first();

        if (!ride) {
            return c.json({ success: false, error: 'سفر یافت نشد یا شما مجاز به ویرایش آن نیستید' }, 404);
        }

        const updates: string[] = [];
        const params: any[] = [];

        if (data.price_per_seat !== undefined) {
            updates.push('price_per_seat = ?');
            params.push(data.price_per_seat);
        }

        if (data.notes !== undefined) {
            updates.push('notes = ?');
            params.push(data.notes);
        }

        if (data.status && ['active', 'cancelled', 'completed'].includes(data.status)) {
            updates.push('status = ?');
            params.push(data.status);
        }

        if (updates.length === 0) {
            return c.json({ success: false, error: 'هیچ فیلدی برای بروزرسانی ارسال نشد' }, 400);
        }

        updates.push('updated_at = ?');
        params.push(Math.floor(Date.now() / 1000));
        params.push(rideId);

        await db.prepare(`
      UPDATE rides SET ${updates.join(', ')} WHERE id = ?
    `).bind(...params).run();

        return c.json({
            success: true,
            message: 'سفر با موفقیت بروزرسانی شد',
        });

    } catch (error) {
        console.error('Update ride error:', error);
        return c.json({ success: false, error: 'خطا در بروزرسانی سفر' }, 500);
    }
});

// ============================================
// HELPER FUNCTIONS
// ============================================

function generateRideSlug(origin: string, destination: string, id: string): string {
    const slugify = (text: string) => {
        // Simple Persian-compatible slug
        return text.toLowerCase()
            .replace(/\s+/g, '-')
            .replace(/[^\w\-آ-ی]/g, '');
    };

    return `${slugify(origin)}-to-${slugify(destination)}-${id}`;
}

export default rides;

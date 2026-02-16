/**
 * Vehicles Routes
 * CRUD for user vehicles
 */

import { Hono } from 'hono';
import { zValidator } from '@hono/zod-validator';
import { z } from 'zod';
import { nanoid } from 'nanoid';
import type { Env, Variables } from '../index';
import { authMiddleware } from '../middleware/auth';

const vehicles = new Hono<{ Bindings: Env, Variables: Variables }>();

const vehicleSchema = z.object({
    make: z.string().min(2),
    model: z.string().min(1),
    year: z.number().min(1350).max(1410),
    color: z.string().min(2),
    license_plate: z.string().min(5),
    total_seats: z.number().min(1).max(8),
});

// ============================================
// GET MY VEHICLES
// ============================================

vehicles.get('/my', authMiddleware, async (c) => {
    try {
        const userId = c.get('userId');
        const results = await c.env.DB.prepare(`
            SELECT * FROM vehicles WHERE user_id = ? AND is_active = 1
        `).bind(userId).all();

        return c.json({
            success: true,
            data: results.results,
        });
    } catch (error) {
        console.error('Get my vehicles error:', error);
        return c.json({ success: false, error: 'خطا در دریافت خودروها' }, 500);
    }
});

// ============================================
// ADD VEHICLE
// ============================================

vehicles.post('/', authMiddleware, zValidator('json', vehicleSchema), async (c) => {
    try {
        const userId = c.get('userId');
        const data = c.req.valid('json');
        const vehicleId = nanoid();
        const timestamp = Math.floor(Date.now() / 1000);

        await c.env.DB.prepare(`
            INSERT INTO vehicles (
                id, user_id, make, model, year, color, 
                license_plate, total_seats, is_verified, is_active,
                created_at, updated_at
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, 1, 1, ?, ?)
        `).bind(
            vehicleId,
            userId,
            data.make,
            data.model,
            data.year,
            data.color,
            data.license_plate,
            data.total_seats,
            timestamp,
            timestamp
        ).run();

        return c.json({
            success: true,
            data: { id: vehicleId },
            message: 'خودرو با موفقیت ثبت شد',
        }, 201);
    } catch (error) {
        console.error('Add vehicle error:', error);
        return c.json({ success: false, error: 'خطا در ثبت خودرو' }, 500);
    }
});

// ============================================
// DELETE VEHICLE (Soft delete)
// ============================================

vehicles.delete('/:id', authMiddleware, async (c) => {
    try {
        const userId = c.get('userId');
        const { id } = c.req.param();

        await c.env.DB.prepare(`
            UPDATE vehicles SET is_active = 0, updated_at = ? 
            WHERE id = ? AND user_id = ?
        `).bind(Math.floor(Date.now() / 1000), id, userId).run();

        return c.json({
            success: true,
            message: 'خودرو با موفقیت حذف شد',
        });
    } catch (error) {
        console.error('Delete vehicle error:', error);
        return c.json({ success: false, error: 'خطا در حذف خودرو' }, 500);
    }
});

export default vehicles;

/**
 * Users Routes
 * Profile, follows, favorites, trip requests
 */

import { Hono } from 'hono';
import { nanoid } from 'nanoid';
import type { D1Database } from '@cloudflare/workers-types';
import type { Env, Variables } from '../index';
import { authMiddleware } from '../middleware/auth';
import { getConfig } from '../utils/config';
import { rateLimitCheck } from '../utils/rateLimit';

const users = new Hono<{ Bindings: Env, Variables: Variables }>();

// ============================================
// FOLLOW/UNFOLLOW USER
// ============================================

users.post('/follow/:userId', authMiddleware, async (c) => {
    try {
        const followerId = c.get('userId');
        const { userId: followedId } = c.req.param();

        if (followerId === followedId) {
            return c.json({ success: false, error: 'نمی‌توانید خودتان را دنبال کنید' }, 400);
        }

        const timestamp = Math.floor(Date.now() / 1000);
        const followId = nanoid();

        await c.env.DB.prepare(`
      INSERT INTO follows (id, follower_id, followed_id, created_at)
      VALUES (?, ?, ?, ?)
    `).bind(followId, followerId, followedId, timestamp).run();

        return c.json({
            success: true,
            message: 'کاربر با موفقیت دنبال شد',
        });

    } catch (error: any) {
        if (error?.message?.includes('UNIQUE')) {
            return c.json({ success: false, error: 'شما قبلاً این کاربر را دنبال کرده‌اید' }, 409);
        }
        console.error('Follow error:', error);
        return c.json({ success: false, error: 'خطا در دنبال کردن' }, 500);
    }
});

users.delete('/follow/:userId', authMiddleware, async (c) => {
    try {
        const followerId = c.get('userId');
        const { userId: followedId } = c.req.param();

        await c.env.DB.prepare(`
      DELETE FROM follows WHERE follower_id = ? AND followed_id = ?
    `).bind(followerId, followedId).run();

        return c.json({
            success: true,
            message: 'دنبال کردن لغو شد',
        });

    } catch (error) {
        console.error('Unfollow error:', error);
        return c.json({ success: false, error: 'خطا در لغو دنبال کردن' }, 500);
    }
});

// ============================================
// ADD/REMOVE FAVORITE DRIVER
// ============================================

users.post('/favorites/:driverId', authMiddleware, async (c) => {
    try {
        const passengerId = c.get('userId');
        const { driverId } = c.req.param();

        // Verify target is a driver
        const driver = await c.env.DB.prepare(
            'SELECT is_driver FROM users WHERE id = ?'
        ).bind(driverId).first<{ is_driver: number }>();

        if (!driver || !driver.is_driver) {
            return c.json({ success: false, error: 'کاربر یافت نشد یا راننده نیست' }, 404);
        }

        const timestamp = Math.floor(Date.now() / 1000);
        const favId = nanoid();

        await c.env.DB.prepare(`
      INSERT INTO favorite_drivers (id, passenger_id, driver_id, created_at)
      VALUES (?, ?, ?, ?)
    `).bind(favId, passengerId, driverId, timestamp).run();

        return c.json({
            success: true,
            message: 'راننده به لیست علاقه‌مندی‌ها اضافه شد',
        });

    } catch (error: any) {
        if (error?.message?.includes('UNIQUE')) {
            return c.json({ success: false, error: 'این راننده قبلاً در لیست شماست' }, 409);
        }
        console.error('Add favorite error:', error);
        return c.json({ success: false, error: 'خطا در افزودن به علاقه‌مندی‌ها' }, 500);
    }
});

users.delete('/favorites/:driverId', authMiddleware, async (c) => {
    try {
        const passengerId = c.get('userId');
        const { driverId } = c.req.param();

        await c.env.DB.prepare(`
      DELETE FROM favorite_drivers WHERE passenger_id = ? AND driver_id = ?
    `).bind(passengerId, driverId).run();

        return c.json({
            success: true,
            message: 'راننده از لیست علاقه‌مندی‌ها حذف شد',
        });

    } catch (error) {
        console.error('Remove favorite error:', error);
        return c.json({ success: false, error: 'خطا در حذف از علاقه‌مندی‌ها' }, 500);
    }
});

// ============================================
// GET FAVORITE DRIVERS
// ============================================

users.get('/favorites', authMiddleware, async (c) => {
    try {
        const userId = c.get('userId');

        const favorites = await c.env.DB.prepare(`
      SELECT u.id, u.full_name, u.avatar_url, u.rating, u.total_ratings,
             fd.created_at as favorited_at
      FROM favorite_drivers fd
      JOIN users u ON fd.driver_id = u.id
      WHERE fd.passenger_id = ?
      ORDER BY fd.created_at DESC
    `).bind(userId).all();

        return c.json({
            success: true,
            data: favorites.results,
        });

    } catch (error) {
        console.error('Get favorites error:', error);
        return c.json({ success: false, error: 'خطا در دریافت لیست علاقه‌مندی‌ها' }, 500);
    }
});

// ============================================
// CREATE TRIP REQUEST
// ============================================

users.post('/trip-requests', authMiddleware, async (c) => {
    try {
        const passengerId = c.get('userId');
        const data = await c.req.json();

        // Rate limiting
        const config = await getConfig(c.env.DB);
        const today = new Date().toISOString().split('T')[0];
        const rateLimitKey = `trip_request:${passengerId}:${today}`;

        const canProceed = await rateLimitCheck(
            c.env.DB,
            rateLimitKey,
            config.max_trip_requests_per_day,
            86400
        );

        if (!canProceed) {
            return c.json({
                success: false,
                error: `شما امروز بیش از ${config.max_trip_requests_per_day} درخواست ارسال کرده‌اید`,
            }, 429);
        }

        const requestId = nanoid();
        const timestamp = Math.floor(Date.now() / 1000);
        const expiresAt = data.requested_departure_end || (data.requested_departure_start + 86400 * 7);

        await c.env.DB.prepare(`
      INSERT INTO trip_requests (
        id, passenger_id, origin_city, origin_address,
        destination_city, destination_address,
        requested_departure_start, requested_departure_end,
        seats_needed, max_price_per_seat, notes, notify_favorites,
        status, created_at, updated_at, expires_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'active', ?, ?, ?)
    `).bind(
            requestId,
            passengerId,
            data.origin_city,
            data.origin_address || null,
            data.destination_city,
            data.destination_address || null,
            data.requested_departure_start,
            data.requested_departure_end || null,
            data.seats_needed,
            data.max_price_per_seat || null,
            data.notes || null,
            data.notify_favorites !== false ? 1 : 0,
            timestamp,
            timestamp,
            expiresAt
        ).run();

        // If notify_favorites is true, broadcast to favorite drivers
        if (data.notify_favorites !== false) {
            await broadcastTripRequest(c.env.DB, requestId, passengerId);
        }

        return c.json({
            success: true,
            data: { request_id: requestId },
            message: 'درخواست سفر با موفقیت ارسال شد',
        }, 201);

    } catch (error) {
        console.error('Create trip request error:', error);
        return c.json({ success: false, error: 'خطا در ارسال درخواست سفر' }, 500);
    }
});

// ============================================
// GET MY TRIP REQUESTS
// ============================================

users.get('/trip-requests/my', authMiddleware, async (c) => {
    try {
        const userId = c.get('userId');

        const requests = await c.env.DB.prepare(`
            SELECT * FROM trip_requests 
            WHERE passenger_id = ? 
            ORDER BY created_at DESC
        `).bind(userId).all();

        return c.json({
            success: true,
            data: requests.results,
        });

    } catch (error) {
        console.error('Get my trip requests error:', error);
        return c.json({ success: false, error: 'خطا در دریافت درخواست‌های سفر' }, 500);
    }
});

// Helper function to broadcast trip request
async function broadcastTripRequest(db: D1Database, requestId: string, passengerId: string) {
    // Get all favorite drivers
    const favorites = await db.prepare(`
    SELECT driver_id FROM favorite_drivers WHERE passenger_id = ?
  `).bind(passengerId).all();

    const timestamp = Math.floor(Date.now() / 1000);

    // Insert recipients
    for (const fav of favorites.results) {
        const recipientId = nanoid();
        await db.prepare(`
      INSERT INTO trip_request_recipients (
        id, trip_request_id, driver_id, status, created_at
      ) VALUES (?, ?, ?, 'sent', ?)
    `).bind(recipientId, requestId, fav.driver_id, timestamp).run();

        // TODO: Send push notification to driver
    }
}

// ============================================
// GET USER PROFILE (Public)
// ============================================

users.get('/:userId', async (c) => {
    try {
        const { userId } = c.req.param();

        const user = await c.env.DB.prepare(`
            SELECT id, full_name, avatar_url, bio, rating, total_ratings, 
                   is_driver, created_at FROM users WHERE id = ?
        `).bind(userId).first();

        if (!user) {
            return c.json({ success: false, error: 'کاربر یافت نشد' }, 404);
        }

        // Also get vehicles if driver
        let vehicles: any[] = [];
        if (user.is_driver) {
            const vehicleResult = await c.env.DB.prepare(`
                SELECT * FROM vehicles WHERE user_id = ? AND is_active = 1
            `).bind(userId).all();
            vehicles = vehicleResult.results;
        }

        return c.json({
            success: true,
            data: {
                ...user,
                vehicles,
            },
        });

    } catch (error) {
        console.error('Get profile error:', error);
        return c.json({ success: false, error: 'خطا در دریافت پروفایل' }, 500);
    }
});

// ============================================
// GET USER RATINGS
// ============================================

users.get('/:userId/ratings', async (c) => {
    try {
        const { userId } = c.req.param();
        const { limit = '20' } = c.req.query();

        const ratings = await c.env.DB.prepare(`
            SELECT r.*, u.full_name as reviewer_name, u.avatar_url as reviewer_avatar
            FROM ratings r
            JOIN users u ON r.reviewer_id = u.id
            WHERE r.reviewed_id = ?
            ORDER BY r.created_at DESC
            LIMIT ?
        `).bind(userId, parseInt(limit)).all();

        return c.json({
            success: true,
            data: ratings.results,
        });

    } catch (error) {
        console.error('Get user ratings error:', error);
        return c.json({ success: false, error: 'خطا در دریافت نظرات' }, 500);
    }
});

// ============================================
// GET MY PROFILE
// ============================================

users.get('/me', authMiddleware, async (c) => {
    try {
        const userId = c.get('userId');

        const user = await c.env.DB.prepare(`
            SELECT id, email, phone, full_name, avatar_url, bio, 
                   rating, total_ratings, is_driver, is_admin, status, created_at 
            FROM users WHERE id = ?
        `).bind(userId).first();

        if (!user) {
            return c.json({ success: false, error: 'کاربر یافت نشد' }, 404);
        }

        return c.json({
            success: true,
            data: user,
        });

    } catch (error) {
        console.error('Get my profile error:', error);
        return c.json({ success: false, error: 'خطا در دریافت اطلاعات کاربر' }, 500);
    }
});

// ============================================
// UPDATE MY PROFILE
// ============================================

users.patch('/me', authMiddleware, async (c) => {
    try {
        const userId = c.get('userId');
        const data = await c.req.json();
        const { full_name, bio, avatar_url } = data;

        const timestamp = Math.floor(Date.now() / 1000);
        const updates: string[] = ['updated_at = ?'];
        const params: any[] = [timestamp];

        if (full_name) {
            updates.push('full_name = ?');
            params.push(full_name);
        }
        if (bio !== undefined) {
            updates.push('bio = ?');
            params.push(bio);
        }
        if (avatar_url !== undefined) {
            updates.push('avatar_url = ?');
            params.push(avatar_url);
        }

        if (updates.length === 1) {
            return c.json({ success: false, error: 'هیچ تغییری وارد نشده است' }, 400);
        }

        params.push(userId);

        await c.env.DB.prepare(`
            UPDATE users SET ${updates.join(', ')} WHERE id = ?
        `).bind(...params).run();

        return c.json({
            success: true,
            message: 'پروفایل با موفقیت بروزرسانی شد',
        });

    } catch (error) {
        console.error('Update profile error:', error);
        return c.json({ success: false, error: 'خطا در بروزرسانی پروفایل' }, 500);
    }
});

// ============================================
// BECOME A DRIVER
// ============================================

users.post('/become-driver', authMiddleware, async (c) => {
    try {
        const userId = c.get('userId');
        const data = await c.req.json();
        const { vehicle } = data;

        console.log('Become driver request for:', userId, vehicle);

        const timestamp = Math.floor(Date.now() / 1000);

        // 1. Update user to driver
        await c.env.DB.prepare(`
            UPDATE users SET is_driver = 1, updated_at = ? WHERE id = ?
        `).bind(timestamp, userId).run();

        // 2. If vehicle data provided, insert it
        if (vehicle) {
            const vehicleId = crypto.randomUUID();
            const seats = parseInt(vehicle.total_seats) || 4;
            const year = parseInt(vehicle.year) || 1402;

            await c.env.DB.prepare(`
                INSERT INTO vehicles (
                    id, user_id, make, model, year, color, 
                    license_plate, total_seats, is_verified, is_active,
                    created_at, updated_at
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, 1, 1, ?, ?)
            `).bind(
                vehicleId,
                userId,
                vehicle.make,
                vehicle.model,
                year,
                vehicle.color,
                vehicle.license_plate,
                seats,
                timestamp,
                timestamp
            ).run();
        }

        return c.json({
            success: true,
            message: 'تبریک! شما اکنون راننده هستید',
        });

    } catch (error: any) {
        console.error('Become driver error:', error);
        return c.json({
            success: false,
            error: 'خطا در فرآیند راننده شدن: ' + (error.message || 'Unknown error')
        }, 500);
    }
});

export default users;

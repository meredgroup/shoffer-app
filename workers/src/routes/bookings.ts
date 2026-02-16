/**
 * Bookings Routes
 * Create, manage bookings with concurrency control
 */

import { Hono } from 'hono';
import { zValidator } from '@hono/zod-validator';
import { z } from 'zod';
import { nanoid } from 'nanoid';
import type { Env, Variables } from '../index';
import { authMiddleware, driverMiddleware } from '../middleware/auth';
import { getConfig } from '../utils/config';

const bookings = new Hono<{ Bindings: Env, Variables: Variables }>();

const createBookingSchema = z.object({
    ride_id: z.string(),
    seats_booked: z.number().min(1).max(8),
    payment_method: z.enum(['CASH', 'ONLINE']),
    idempotency_key: z.string().optional(),
});

// ============================================
// CREATE BOOKING (with Durable Object)
// ============================================

bookings.post('/', authMiddleware, zValidator('json', createBookingSchema), async (c) => {
    try {
        const userId = c.get('userId');
        const data = c.req.valid('json');
        const { ride_id, seats_booked, payment_method, idempotency_key } = data;

        // Check feature flag for phone verification requirement
        const config = await getConfig(c.env.DB);
        if (config.require_phone_verification_for_booking) {
            const user = await c.env.DB.prepare(
                'SELECT phone_verified FROM users WHERE id = ?'
            ).bind(userId).first();

            if (!user || !user.phone_verified) {
                return c.json({
                    success: false,
                    error: 'برای رزرو باید شماره تلفن خود را تأیید کنید'
                }, 403);
            }
        }

        // Check for duplicate booking (idempotency)
        if (idempotency_key) {
            const existing = await c.env.DB.prepare(
                'SELECT id FROM bookings WHERE idempotency_key = ?'
            ).bind(idempotency_key).first();

            if (existing) {
                return c.json({
                    success: true,
                    data: { booking_id: existing.id },
                    message: 'رزرو قبلاً ثبت شده است',
                });
            }
        }

        // Get ride details
        const ride = await c.env.DB.prepare(`
      SELECT id, driver_id, available_seats, price_per_seat, status
      FROM rides WHERE id = ?
    `).bind(ride_id).first();

        if (!ride) {
            return c.json({ success: false, error: 'سفر یافت نشد' }, 404);
        }

        if (ride.status !== 'active') {
            return c.json({ success: false, error: 'این سفر دیگر فعال نیست' }, 400);
        }

        if (ride.driver_id === userId) {
            return c.json({ success: false, error: 'نمی‌توانید سفر خود را رزرو کنید' }, 400);
        }

        // Use direct D1 update for simplified version (instead of Durable Object)
        const updatedRide = await c.env.DB.prepare(`
            UPDATE rides 
            SET available_seats = available_seats - ? 
            WHERE id = ? AND available_seats >= ? AND status = 'active'
            RETURNING id, driver_id, price_per_seat
        `).bind(seats_booked, ride_id, seats_booked).first<{ id: string, driver_id: string, price_per_seat: number }>();

        if (!updatedRide) {
            return c.json({ success: false, error: 'ظرفیت تکمیل است یا سفر دیگر فعال نیست' }, 400);
        }

        const bookingId = nanoid();
        const timestamp = Math.floor(Date.now() / 1000);
        const totalPrice = updatedRide.price_per_seat * seats_booked;

        await c.env.DB.prepare(`
            INSERT INTO bookings (
                id, ride_id, passenger_id, seats_booked, total_price, 
                payment_method, status, idempotency_key, created_at, updated_at
            ) VALUES (?, ?, ?, ?, ?, ?, 'PENDING', ?, ?, ?)
        `).bind(
            bookingId,
            ride_id,
            userId,
            seats_booked,
            totalPrice,
            payment_method,
            idempotency_key || nanoid(),
            timestamp,
            timestamp
        ).run();

        return c.json({
            success: true,
            data: { booking_id: bookingId },
            message: 'رزرو با موفقیت ثبت شد',
        }, 201);

    } catch (error) {
        console.error('Create booking error:', error);
        return c.json({ success: false, error: 'خطا در ثبت رزرو' }, 500);
    }
});

// ============================================
// GET USER BOOKINGS
// ============================================

bookings.get('/my', authMiddleware, async (c) => {
    try {
        const userId = c.get('userId');
        const { status, role } = c.req.query();

        let query = `
      SELECT b.*, r.origin_city, r.destination_city, r.departure_time,
             u.full_name as other_party_name, u.avatar_url as other_party_avatar
      FROM bookings b
      JOIN rides r ON b.ride_id = r.id
    `;

        const params: any[] = [];

        if (role === 'driver') {
            query += ` JOIN users u ON b.passenger_id = u.id
                 WHERE r.driver_id = ?`;
            params.push(userId);
        } else {
            query += ` JOIN users u ON r.driver_id = u.id
                 WHERE b.passenger_id = ?`;
            params.push(userId);
        }

        if (status) {
            query += ` AND b.status = ?`;
            params.push(status);
        }

        query += ` ORDER BY b.created_at DESC LIMIT 50`;

        const results = await c.env.DB.prepare(query).bind(...params).all();

        return c.json({
            success: true,
            data: results.results,
        });

    } catch (error) {
        console.error('Get bookings error:', error);
        return c.json({ success: false, error: 'خطا در دریافت رزروها' }, 500);
    }
});

// ============================================
// UPDATE BOOKING STATUS
// ============================================

bookings.put('/:bookingId/status', authMiddleware, async (c) => {
    try {
        const userId = c.get('userId');
        const { bookingId } = c.req.param();
        const { status } = await c.req.json();

        if (!['CONFIRMED', 'CANCELLED', 'COMPLETED'].includes(status)) {
            return c.json({ success: false, error: 'وضعیت نامعتبر است' }, 400);
        }

        // Get booking with ride info
        const booking = await c.env.DB.prepare(`
      SELECT b.*, r.driver_id 
      FROM bookings b
      JOIN rides r ON b.ride_id = r.id
      WHERE b.id = ?
    `).bind(bookingId).first();

        if (!booking) {
            return c.json({ success: false, error: 'رزرو یافت نشد' }, 404);
        }

        // Authorization: driver can confirm/complete, passenger can cancel
        const isDriver = booking.driver_id === userId;
        const isPassenger = booking.passenger_id === userId;

        if (!isDriver && !isPassenger) {
            return c.json({ success: false, error: 'شما مجاز به این عملیات نیستید' }, 403);
        }

        if (status === 'CANCELLED' && !isPassenger) {
            return c.json({ success: false, error: 'فقط مسافر می‌تواند رزرو را لغو کند' }, 403);
        }

        if ((status === 'CONFIRMED' || status === 'COMPLETED') && !isDriver) {
            return c.json({ success: false, error: 'فقط راننده می‌تواند رزرو را تأیید کند' }, 403);
        }

        const timestamp = Math.floor(Date.now() / 1000);
        const updates: string[] = ['status = ?', 'updated_at = ?'];
        const params: any[] = [status, timestamp];

        if (status === 'CONFIRMED') {
            updates.push('confirmed_at = ?');
            params.push(timestamp);
        } else if (status === 'CANCELLED') {
            updates.push('cancelled_at = ?');
            params.push(timestamp);

            // Return seats to ride
            await c.env.DB.prepare(`
        UPDATE rides 
        SET available_seats = available_seats + ?
        WHERE id = ?
      `).bind(booking.seats_booked, booking.ride_id).run();

        } else if (status === 'COMPLETED') {
            updates.push('completed_at = ?');
            params.push(timestamp);
        }

        params.push(bookingId);

        await c.env.DB.prepare(`
      UPDATE bookings SET ${updates.join(', ')} WHERE id = ?
    `).bind(...params).run();

        // TODO: Send notification to other party

        return c.json({
            success: true,
            message: 'وضعیت رزرو بروزرسانی شد',
        });

    } catch (error) {
        console.error('Update booking error:', error);
        return c.json({ success: false, error: 'خطا در بروزرسانی رزرو' }, 500);
    }
});

// ============================================
// RATE A BOOKING
// ============================================

bookings.post('/:bookingId/rate', authMiddleware, async (c) => {
    try {
        const userId = c.get('userId');
        const { bookingId } = c.req.param();
        const { stars, review_text } = await c.req.json();

        if (!stars || stars < 1 || stars > 5) {
            return c.json({ success: false, error: 'امتیاز باید بین ۱ تا ۵ باشد' }, 400);
        }

        // Get booking and verify it's completed
        const booking = await c.env.DB.prepare(`
            SELECT b.*, r.driver_id, r.id as ride_id
            FROM bookings b
            JOIN rides r ON b.ride_id = r.id
            WHERE b.id = ?
        `).bind(bookingId).first<{
            id: string,
            passenger_id: string,
            driver_id: string,
            status: string
        }>();

        if (!booking) {
            return c.json({ success: false, error: 'رزرو یافت نشد' }, 404);
        }

        if (booking.status !== 'COMPLETED') {
            return c.json({ success: false, error: 'فقط سفرهای تمام شده قابل امتیازدهی هستند' }, 400);
        }

        // Only passenger can rate the driver (for now, can be bilateral later)
        if (booking.passenger_id !== userId) {
            return c.json({ success: false, error: 'شما مجاز به امتیازدهی نیستید' }, 403);
        }

        const timestamp = Math.floor(Date.now() / 1000);
        const ratingId = nanoid();

        // Start transaction (manual in D1 via Batch)
        await c.env.DB.batch([
            // 1. Insert rating
            c.env.DB.prepare(`
                INSERT INTO ratings (id, booking_id, reviewer_id, reviewed_id, stars, review_text, created_at)
                VALUES (?, ?, ?, ?, ?, ?, ?)
            `).bind(ratingId, bookingId, userId, booking.driver_id, stars, review_text || null, timestamp),

            // 2. Update user average rating
            c.env.DB.prepare(`
                UPDATE users 
                SET rating = (rating * total_ratings + ?) / (total_ratings + 1),
                    total_ratings = total_ratings + 1
                WHERE id = ?
            `).bind(stars, booking.driver_id)
        ]);

        return c.json({
            success: true,
            message: 'امتیاز شما با موفقیت ثبت شد',
        });

    } catch (error: any) {
        if (error?.message?.includes('UNIQUE')) {
            return c.json({ success: false, error: 'شما قبلاً به این سفر امتیاز داده‌اید' }, 409);
        }
        console.error('Rate booking error:', error);
        return c.json({ success: false, error: 'خطا در ثبت امتیاز' }, 500);
    }
});

export default bookings;

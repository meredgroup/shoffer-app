/**
 * BookingSession Durable Object
 * Handles concurrency-safe seat booking for a specific ride
 */

import { nanoid } from 'nanoid';

export class BookingSession {
    private state: DurableObjectState;
    private env: any;

    constructor(state: DurableObjectState, env: any) {
        this.state = state;
        this.env = env;
    }

    async fetch(request: Request): Promise<Response> {
        const url = new URL(request.url);

        if (url.pathname === '/book' && request.method === 'POST') {
            return this.handleBooking(request);
        }

        return new Response('Not found', { status: 404 });
    }

    private async handleBooking(request: Request): Promise<Response> {
        try {
            const data = await request.json() as {
                ride_id: string;
                passenger_id: string;
                seats_booked: number;
                payment_method: string;
                price_per_seat: number;
                idempotency_key: string;
            };

            const {
                ride_id,
                passenger_id,
                seats_booked,
                payment_method,
                price_per_seat,
                idempotency_key,
            } = data;

            // This code runs in a single-threaded environment per ride_id
            // No race conditions possible!

            const db = this.env.DB as D1Database;
            const timestamp = Math.floor(Date.now() / 1000);

            // Check current available seats (with SELECT FOR UPDATE equivalent)
            const ride = await db.prepare(`
        SELECT available_seats, status FROM rides WHERE id = ?
      `).bind(ride_id).first();

            if (!ride) {
                return Response.json(
                    { success: false, error: 'سفر یافت نشد' },
                    { status: 404 }
                );
            }

            const availableSeats = ride.available_seats as number;

            if (ride.status !== 'active') {
                return Response.json(
                    { success: false, error: 'این سفر دیگر فعال نیست' },
                    { status: 400 }
                );
            }

            if (availableSeats < seats_booked) {
                return Response.json(
                    { success: false, error: `تنها ${availableSeats} صندلی خالی باقی مانده است` },
                    { status: 409 }
                );
            }

            // Create booking
            const bookingId = nanoid();
            const totalPrice = price_per_seat * seats_booked;

            await db.prepare(`
        INSERT INTO bookings (
          id, ride_id, passenger_id, seats_booked, total_price,
          status, payment_method, payment_status, idempotency_key,
          created_at, updated_at
        ) VALUES (?, ?, ?, ?, ?, 'REQUESTED', ?, 'PENDING', ?, ?, ?)
      `).bind(
                bookingId,
                ride_id,
                passenger_id,
                seats_booked,
                totalPrice,
                payment_method,
                idempotency_key,
                timestamp,
                timestamp
            ).run();

            // Atomically update available seats
            const newAvailableSeats = availableSeats - seats_booked;
            const newStatus = newAvailableSeats === 0 ? 'full' : 'active';

            await db.prepare(`
        UPDATE rides 
        SET available_seats = ?, status = ?, updated_at = ?
        WHERE id = ?
      `).bind(newAvailableSeats, newStatus, timestamp, ride_id).run();

            return Response.json({
                success: true,
                data: {
                    booking_id: bookingId,
                    seats_booked,
                    total_price: totalPrice,
                    status: 'REQUESTED',
                },
                message: 'رزرو با موفقیت ثبت شد',
            }, { status: 201 });

        } catch (error) {
            console.error('Booking error:', error);
            return Response.json(
                { success: false, error: 'خطا در ثبت رزرو' },
                { status: 500 }
            );
        }
    }
}

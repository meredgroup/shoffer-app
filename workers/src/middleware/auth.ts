/**
 * Authentication & Authorization Middleware
 */

import { Context, Next } from 'hono';
import jwt from 'jsonwebtoken';
import type { Env, Variables } from '../index';

export async function authMiddleware(
    c: Context<{ Bindings: Env, Variables: Variables }>,
    next: Next
) {
    const authHeader = c.req.header('Authorization');

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return c.json({ success: false, error: 'غیرمجاز - توکن یافت نشد' }, 401);
    }

    const token = authHeader.substring(7); // Remove 'Bearer '

    try {
        const decoded = jwt.verify(token, c.env.JWT_SECRET) as { userId: string };

        // Check if user still exists and is active
        const user = await c.env.DB.prepare(
            'SELECT id, status, is_admin FROM users WHERE id = ?'
        ).bind(decoded.userId).first<{ id: string, status: string, is_admin: number }>();

        if (!user) {
            return c.json({ success: false, error: 'کاربر یافت نشد' }, 404);
        }

        if (user.status !== 'active') {
            return c.json({ success: false, error: 'حساب کاربری غیرفعال است' }, 403);
        }

        // Set user context
        c.set('userId', user.id);
        c.set('isAdmin', user.is_admin === 1);

        await next();
    } catch (error) {
        console.error('Auth middleware error:', error);
        return c.json({ success: false, error: 'توکن نامعتبر یا منقضی شده' }, 401);
    }
}

export async function adminMiddleware(
    c: Context<{ Bindings: Env, Variables: Variables }>,
    next: Next
) {
    const isAdmin = c.get('isAdmin');

    if (!isAdmin) {
        return c.json({ success: false, error: 'دسترسی مدیر لازم است' }, 403);
    }

    await next();
}

export async function driverMiddleware(
    c: Context<{ Bindings: Env, Variables: Variables }>,
    next: Next
) {
    const userId = c.get('userId');

    const user = await c.env.DB.prepare(
        'SELECT is_driver FROM users WHERE id = ?'
    ).bind(userId).first();

    if (!user || user.is_driver !== 1) {
        return c.json({ success: false, error: 'این عملیات فقط برای رانندگان مجاز است' }, 403);
    }

    await next();
}

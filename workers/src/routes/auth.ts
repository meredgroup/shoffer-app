/**
 * Authentication Routes
 * Email/password, Google OAuth, Phone/SMS
 */

import { Hono } from 'hono';
import { zValidator } from '@hono/zod-validator';
import { z } from 'zod';
import { nanoid } from 'nanoid';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import type { Env, Variables } from '../index';
import { authMiddleware } from '../middleware/auth';
import { getConfig } from '../utils/config';
import { verifyTurnstile } from '../utils/turnstile';
import { rateLimitCheck } from '../utils/rateLimit';

const auth = new Hono<{ Bindings: Env, Variables: Variables }>();

// ============================================
// SCHEMAS
// ============================================

const registerSchema = z.object({
    email: z.string().email().optional(),
    password: z.string().min(8).optional(),
    phone: z.string().optional(),
    full_name: z.string().min(2),
    google_token: z.string().optional(),
    turnstile_token: z.string(),
}).refine(data => data.email || data.phone || data.google_token, {
    message: 'Email, phone, or Google token required',
});

const loginSchema = z.object({
    email: z.string().email().optional(),
    password: z.string().optional(),
    phone: z.string().optional(),
    otp: z.string().optional(),
    google_token: z.string().optional(),
    turnstile_token: z.string(),
});

// ============================================
// REGISTER
// ============================================

auth.post('/register', zValidator('json', registerSchema), async (c) => {
    try {
        const data = c.req.valid('json');
        const db = c.env.DB;

        // Verify Turnstile
        const turnstileValid = await verifyTurnstile(
            data.turnstile_token,
            c.env.TURNSTILE_SECRET_KEY
        );
        if (!turnstileValid) {
            return c.json({ success: false, error: 'کد امنیتی نامعتبر است' }, 400);
        }

        // Rate limiting
        const clientIP = c.req.header('CF-Connecting-IP') || 'unknown';
        const rateLimitKey = `register:${clientIP}`;
        const canProceed = await rateLimitCheck(db, rateLimitKey, 5, 3600); // 5 per hour
        if (!canProceed) {
            return c.json({ success: false, error: 'تعداد درخواست‌ها بیش از حد مجاز است' }, 429);
        }

        const userId = nanoid();
        const timestamp = Math.floor(Date.now() / 1000);

        // Google OAuth registration
        if (data.google_token) {
            const googleUser = await verifyGoogleToken(data.google_token, c.env.GOOGLE_CLIENT_SECRET);
            if (!googleUser) {
                return c.json({ success: false, error: 'توکن Google نامعتبر است' }, 400);
            }

            // Check if user exists
            const existing = await db.prepare(
                'SELECT id FROM users WHERE google_id = ? OR email = ?'
            ).bind(googleUser.sub, googleUser.email).first();

            if (existing) {
                return c.json({ success: false, error: 'کاربر قبلاً ثبت‌نام کرده است' }, 409);
            }

            await db.prepare(`
        INSERT INTO users (id, google_id, email, email_verified, full_name, avatar_url, status, created_at, updated_at)
        VALUES (?, ?, ?, 1, ?, ?, 'active', ?, ?)
      `).bind(
                userId,
                googleUser.sub,
                googleUser.email,
                data.full_name || googleUser.name,
                googleUser.picture,
                timestamp,
                timestamp
            ).run();

            const token = generateJWT(userId, c.env.JWT_SECRET);

            return c.json({
                success: true,
                data: { user_id: userId, token },
                message: 'ثبت‌نام با موفقیت انجام شد',
            });
        }

        // Email/password registration
        if (data.email && data.password) {
            // Check if email exists
            const existing = await db.prepare('SELECT id FROM users WHERE email = ?')
                .bind(data.email).first();

            if (existing) {
                return c.json({ success: false, error: 'این ایمیل قبلاً ثبت شده است' }, 409);
            }

            const passwordHash = await bcrypt.hash(data.password, 10);

            await db.prepare(`
        INSERT INTO users (id, email, email_verified, password_hash, full_name, status, created_at, updated_at)
        VALUES (?, ?, 0, ?, ?, 'active', ?, ?)
      `).bind(userId, data.email, passwordHash, data.full_name, timestamp, timestamp).run();

            // Insert notification preferences
            await db.prepare(
                'INSERT INTO notification_prefs (user_id, updated_at) VALUES (?, ?)'
            ).bind(userId, timestamp).run();

            const token = generateJWT(userId, c.env.JWT_SECRET);

            return c.json({
                success: true,
                data: { user_id: userId, token },
                message: 'ثبت‌نام با موفقیت انجام شد. لطفاً ایمیل خود را تأیید کنید.',
            });
        }

        // Phone registration (if enabled)
        if (data.phone) {
            const config = await getConfig(db);
            if (!config.enable_phone_login) {
                return c.json({ success: false, error: 'ورود با شماره تلفن غیرفعال است' }, 403);
            }

            // Check if phone exists
            const existing = await db.prepare('SELECT id FROM users WHERE phone = ?')
                .bind(data.phone).first();

            if (existing) {
                return c.json({ success: false, error: 'این شماره تلفن قبلاً ثبت شده است' }, 409);
            }

            // TODO: Send OTP via SMS provider
            // For now, store user and require verification later

            await db.prepare(`
        INSERT INTO users (id, phone, phone_verified, full_name, status, created_at, updated_at)
        VALUES (?, ?, 0, ?, 'active', ?, ?)
      `).bind(userId, data.phone, data.full_name, timestamp, timestamp).run();

            await db.prepare(
                'INSERT INTO notification_prefs (user_id, updated_at) VALUES (?, ?)'
            ).bind(userId, timestamp).run();

            return c.json({
                success: true,
                data: { user_id: userId, requires_verification: true },
                message: 'کد تأیید به شماره تلفن شما ارسال شد',
            });
        }

        return c.json({ success: false, error: 'روش ثبت‌نام نامعتبر است' }, 400);

    } catch (error) {
        console.error('Register error:', error);
        return c.json({
            success: false,
            error: 'خطا در ثبت‌نام. لطفاً دوباره تلاش کنید.'
        }, 500);
    }
});

// ============================================
// LOGIN
// ============================================

auth.post('/login', zValidator('json', loginSchema), async (c) => {
    try {
        const data = c.req.valid('json');
        const db = c.env.DB;

        // Verify Turnstile
        const turnstileValid = await verifyTurnstile(
            data.turnstile_token,
            c.env.TURNSTILE_SECRET_KEY
        );
        if (!turnstileValid) {
            return c.json({ success: false, error: 'کد امنیتی نامعتبر است' }, 400);
        }

        // Rate limiting
        const clientIP = c.req.header('CF-Connecting-IP') || 'unknown';
        const rateLimitKey = `login:${clientIP}`;
        const canProceed = await rateLimitCheck(db, rateLimitKey, 10, 900); // 10 per 15 min
        if (!canProceed) {
            return c.json({ success: false, error: 'تعداد تلاش‌ها بیش از حد مجاز است' }, 429);
        }

        // Google OAuth login
        if (data.google_token) {
            const googleUser = await verifyGoogleToken(data.google_token, c.env.GOOGLE_CLIENT_SECRET);
            if (!googleUser) {
                return c.json({ success: false, error: 'توکن Google نامعتبر است' }, 400);
            }

            const user = await db.prepare(
                'SELECT id, status FROM users WHERE google_id = ?'
            ).bind(googleUser.sub).first();

            if (!user) {
                return c.json({ success: false, error: 'کاربر یافت نشد. لطفاً ابتدا ثبت‌نام کنید.' }, 404);
            }

            if (user.status !== 'active') {
                return c.json({ success: false, error: 'حساب کاربری شما مسدود شده است' }, 403);
            }

            const token = generateJWT(user.id as string, c.env.JWT_SECRET);

            return c.json({
                success: true,
                data: { user_id: user.id, token },
            });
        }

        // Email/password login
        if (data.email && data.password) {
            const user = await db.prepare(
                'SELECT id, password_hash, status FROM users WHERE email = ?'
            ).bind(data.email).first();

            if (!user || !user.password_hash) {
                return c.json({ success: false, error: 'ایمیل یا رمز عبور اشتباه است' }, 401);
            }

            const passwordValid = await bcrypt.compare(data.password, user.password_hash as string);
            if (!passwordValid) {
                return c.json({ success: false, error: 'ایمیل یا رمز عبور اشتباه است' }, 401);
            }

            if (user.status !== 'active') {
                return c.json({ success: false, error: 'حساب کاربری شما مسدود شده است' }, 403);
            }

            const token = generateJWT(user.id as string, c.env.JWT_SECRET);

            return c.json({
                success: true,
                data: { user_id: user.id, token },
            });
        }

        // Phone/OTP login (if enabled)
        if (data.phone && data.otp) {
            const config = await getConfig(db);
            if (!config.enable_phone_login) {
                return c.json({ success: false, error: 'ورود با شماره تلفن غیرفعال است' }, 403);
            }

            // TODO: Verify OTP from KV or cache
            // For now, simplified version

            const user = await db.prepare(
                'SELECT id, status FROM users WHERE phone = ?'
            ).bind(data.phone).first();

            if (!user) {
                return c.json({ success: false, error: 'کاربر یافت نشد' }, 404);
            }

            if (user.status !== 'active') {
                return c.json({ success: false, error: 'حساب کاربری شما مسدود شده است' }, 403);
            }

            const token = generateJWT(user.id as string, c.env.JWT_SECRET);

            return c.json({
                success: true,
                data: { user_id: user.id, token },
            });
        }

        return c.json({ success: false, error: 'روش ورود نامعتبر است' }, 400);

    } catch (error) {
        console.error('Login error:', error);
        return c.json({
            success: false,
            error: 'خطا در ورود. لطفاً دوباره تلاش کنید.'
        }, 500);
    }
});

// ============================================
// GET CURRENT USER
// ============================================

auth.get('/me', authMiddleware, async (c) => {
    try {
        const userId = c.get('userId'); // Set by auth middleware
        if (!userId) {
            return c.json({ success: false, error: 'غیرمجاز' }, 401);
        }

        const user = await c.env.DB.prepare(`
      SELECT id, email, phone, full_name, avatar_url, bio, rating, total_ratings,
             is_driver, is_admin, status, created_at
      FROM users WHERE id = ?
    `).bind(userId).first();

        if (!user) {
            return c.json({ success: false, error: 'کاربر یافت نشد' }, 404);
        }

        return c.json({ success: true, data: user });

    } catch (error) {
        console.error('Get user error:', error);
        return c.json({ success: false, error: 'خطا در دریافت اطلاعات کاربر' }, 500);
    }
});

// ============================================
// HELPER FUNCTIONS
// ============================================

function generateJWT(userId: string, secret: string): string {
    return jwt.sign(
        { userId, iat: Math.floor(Date.now() / 1000) },
        secret,
        { expiresIn: '30d' }
    );
}

async function verifyGoogleToken(token: string, clientSecret?: string): Promise<any> {
    try {
        // Call Google token verification API
        const response = await fetch(`https://oauth2.googleapis.com/tokeninfo?id_token=${token}`);
        if (!response.ok) return null;

        const data = await response.json();
        return data;
    } catch (error) {
        console.error('Google token verification error:', error);
        return null;
    }
}

export default auth;

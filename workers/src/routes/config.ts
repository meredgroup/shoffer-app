/**
 * Config Routes
 * Public endpoint for feature flags (client needs to know UI state)
 */

import { Hono } from 'hono';
import type { Env, Variables } from '../index';
import { getConfig, updateConfig } from '../utils/config';
import { authMiddleware, adminMiddleware } from '../middleware/auth';

const config = new Hono<{ Bindings: Env, Variables: Variables }>();

// ============================================
// GET PUBLIC CONFIG (no auth required)
// ============================================

config.get('/public', async (c) => {
    try {
        const featureFlags = await getConfig(c.env.DB);

        // Return only client-relevant flags
        return c.json({
            success: true,
            data: {
                enable_phone_login: featureFlags.enable_phone_login,
                map_provider: featureFlags.map_provider,
            },
        });
    } catch (error) {
        console.error('Get config error:', error);
        return c.json({ success: false, error: 'خطا در دریافت تنظیمات' }, 500);
    }
});

// ============================================
// GET ALL CONFIG (admin only)
// ============================================

config.get('/all', authMiddleware, adminMiddleware, async (c) => {
    try {
        const results = await c.env.DB.prepare(
            'SELECT * FROM app_config ORDER BY key'
        ).all();

        return c.json({
            success: true,
            data: results.results,
        });
    } catch (error) {
        console.error('Get all config error:', error);
        return c.json({ success: false, error: 'خطا در دریافت تنظیمات' }, 500);
    }
});

// ============================================
// UPDATE CONFIG (admin only)
// ============================================

config.put('/:key', authMiddleware, adminMiddleware, async (c) => {
    try {
        const { key } = c.req.param();
        const { value, value_type } = await c.req.json();
        const adminId = c.get('userId');

        if (!value || !value_type) {
            return c.json({ success: false, error: 'مقدار و نوع مقدار الزامی است' }, 400);
        }

        await updateConfig(c.env.DB, key, value, value_type, adminId);

        // Log admin action
        const timestamp = Math.floor(Date.now() / 1000);
        await c.env.DB.prepare(`
      INSERT INTO admin_audit_log (id, admin_id, action, target_type, target_id, details, created_at)
      VALUES (?, ?, 'update_config', 'config', ?, ?, ?)
    `).bind(
            crypto.randomUUID(),
            adminId,
            key,
            JSON.stringify({ value, value_type }),
            timestamp
        ).run();

        return c.json({
            success: true,
            message: 'تنظیمات با موفقیت بروزرسانی شد',
        });
    } catch (error) {
        console.error('Update config error:', error);
        return c.json({ success: false, error: 'خطا در بروزرسانی تنظیمات' }, 500);
    }
});

export default config;

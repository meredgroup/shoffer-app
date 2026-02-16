/**
 * Admin Routes
 * User management, feature flags, reports, audit logs
 */

import { Hono } from 'hono';
import type { Env, Variables } from '../index';
import { authMiddleware, adminMiddleware } from '../middleware/auth';
import { nanoid } from 'nanoid';

const admin = new Hono<{ Bindings: Env, Variables: Variables }>();

// All routes require admin
admin.use('/*', authMiddleware, adminMiddleware);

// ============================================
// USER MANAGEMENT
// ============================================

admin.get('/users', async (c) => {
    try {
        const { status, search, limit = '50' } = c.req.query();

        let query = `SELECT id, email, phone, full_name, is_driver, is_admin, status, 
                        rating, total_ratings, created_at FROM users WHERE 1=1`;
        const params: any[] = [];

        if (status) {
            query += ` AND status = ?`;
            params.push(status);
        }

        if (search) {
            query += ` AND (full_name LIKE ? OR email LIKE ? OR phone LIKE ?)`;
            params.push(`%${search}%`, `%${search}%`, `%${search}%`);
        }

        query += ` ORDER BY created_at DESC LIMIT ?`;
        params.push(parseInt(limit));

        const results = await c.env.DB.prepare(query).bind(...params).all();

        return c.json({
            success: true,
            data: results.results,
        });

    } catch (error) {
        console.error('Get users error:', error);
        return c.json({ success: false, error: 'خطا در دریافت کاربران' }, 500);
    }
});

admin.put('/users/:userId/status', async (c) => {
    try {
        const adminId = c.get('userId');
        const { userId } = c.req.param();
        const { status } = await c.req.json();

        if (!['active', 'suspended', 'banned'].includes(status)) {
            return c.json({ success: false, error: 'وضعیت نامعتبر است' }, 400);
        }

        const timestamp = Math.floor(Date.now() / 1000);

        await c.env.DB.prepare(`
      UPDATE users SET status = ?, updated_at = ? WHERE id = ?
    `).bind(status, timestamp, userId).run();

        // Log admin action
        await c.env.DB.prepare(`
      INSERT INTO admin_audit_log (id, admin_id, action, target_type, target_id, details, created_at)
      VALUES (?, ?, 'change_user_status', 'user', ?, ?, ?)
    `).bind(
            nanoid(),
            adminId,
            userId,
            JSON.stringify({ new_status: status }),
            timestamp
        ).run();

        return c.json({
            success: true,
            message: 'وضعیت کاربر بروزرسانی شد',
        });

    } catch (error) {
        console.error('Update user status error:', error);
        return c.json({ success: false, error: 'خطا در بروزرسانی وضعیت' }, 500);
    }
});

// ============================================
// RIDE MANAGEMENT
// ============================================

admin.get('/rides', async (c) => {
    try {
        const { status, limit = '50' } = c.req.query();

        let query = `
      SELECT r.*, u.full_name as driver_name, u.email as driver_email
      FROM rides r
      JOIN users u ON r.driver_id = u.id
      WHERE 1=1
    `;
        const params: any[] = [];

        if (status) {
            query += ` AND r.status = ?`;
            params.push(status);
        }

        query += ` ORDER BY r.created_at DESC LIMIT ?`;
        params.push(parseInt(limit));

        const results = await c.env.DB.prepare(query).bind(...params).all();

        return c.json({
            success: true,
            data: results.results,
        });

    } catch (error) {
        console.error('Get rides error:', error);
        return c.json({ success: false, error: 'خطا در دریافت سفرها' }, 500);
    }
});

admin.put('/rides/:rideId/status', async (c) => {
    try {
        const adminId = c.get('userId');
        const { rideId } = c.req.param();
        const { status, reason } = await c.req.json();

        if (!['active', 'cancelled', 'completed'].includes(status)) {
            return c.json({ success: false, error: 'وضعیت نامعتبر است' }, 400);
        }

        const timestamp = Math.floor(Date.now() / 1000);

        await c.env.DB.prepare(`
      UPDATE rides SET status = ?, updated_at = ? WHERE id = ?
    `).bind(status, timestamp, rideId).run();

        // Log admin action
        await c.env.DB.prepare(`
      INSERT INTO admin_audit_log (id, admin_id, action, target_type, target_id, details, created_at)
      VALUES (?, ?, 'change_ride_status', 'ride', ?, ?, ?)
    `).bind(
            nanoid(),
            adminId,
            rideId,
            JSON.stringify({ new_status: status, reason }),
            timestamp
        ).run();

        return c.json({
            success: true,
            message: 'وضعیت سفر بروزرسانی شد',
        });

    } catch (error) {
        console.error('Update ride status error:', error);
        return c.json({ success: false, error: 'خطا در بروزرسانی سفر' }, 500);
    }
});

// ============================================
// REPORTS
// ============================================

admin.get('/reports', async (c) => {
    try {
        const { status = 'pending', limit = '50' } = c.req.query();

        const results = await c.env.DB.prepare(`
      SELECT r.*, 
             reporter.full_name as reporter_name,
             reported_user.full_name as reported_user_name
      FROM reports r
      JOIN users reporter ON r.reporter_id = reporter.id
      LEFT JOIN users reported_user ON r.reported_user_id = reported_user.id
      WHERE r.status = ?
      ORDER BY r.created_at DESC
      LIMIT ?
    `).bind(status, parseInt(limit)).all();

        return c.json({
            success: true,
            data: results.results,
        });

    } catch (error) {
        console.error('Get reports error:', error);
        return c.json({ success: false, error: 'خطا در دریافت گزارش‌ها' }, 500);
    }
});

admin.put('/reports/:reportId/resolve', async (c) => {
    try {
        const adminId = c.get('userId');
        const { reportId } = c.req.param();
        const { status, admin_notes } = await c.req.json();

        if (!['reviewed', 'resolved', 'dismissed'].includes(status)) {
            return c.json({ success: false, error: 'وضعیت نامعتبر است' }, 400);
        }

        const timestamp = Math.floor(Date.now() / 1000);

        await c.env.DB.prepare(`
      UPDATE reports 
      SET status = ?, admin_notes = ?, resolved_by = ?, resolved_at = ?
      WHERE id = ?
    `).bind(status, admin_notes, adminId, timestamp, reportId).run();

        // Log admin action
        await c.env.DB.prepare(`
      INSERT INTO admin_audit_log (id, admin_id, action, target_type, target_id, details, created_at)
      VALUES (?, ?, 'resolve_report', 'report', ?, ?, ?)
    `).bind(
            nanoid(),
            adminId,
            reportId,
            JSON.stringify({ status, notes: admin_notes }),
            timestamp
        ).run();

        return c.json({
            success: true,
            message: 'گزارش بروزرسانی شد',
        });

    } catch (error) {
        console.error('Resolve report error:', error);
        return c.json({ success: false, error: 'خطا در بروزرسانی گزارش' }, 500);
    }
});

// ============================================
// AUDIT LOGS
// ============================================

admin.get('/audit-logs', async (c) => {
    try {
        const { limit = '100' } = c.req.query();

        const results = await c.env.DB.prepare(`
      SELECT al.*, u.full_name as admin_name, u.email as admin_email
      FROM admin_audit_log al
      JOIN users u ON al.admin_id = u.id
      ORDER BY al.created_at DESC
      LIMIT ?
    `).bind(parseInt(limit)).all();

        return c.json({
            success: true,
            data: results.results,
        });

    } catch (error) {
        console.error('Get audit logs error:', error);
        return c.json({ success: false, error: 'خطا در دریافت گزارش‌های ممیزی' }, 500);
    }
});

// ============================================
// STATISTICS
// ============================================

admin.get('/stats', async (c) => {
    try {
        const db = c.env.DB;

        const [totalUsers, totalRides, totalBookings, pendingReports] = await Promise.all([
            db.prepare('SELECT COUNT(*) as count FROM users').first(),
            db.prepare('SELECT COUNT(*) as count FROM rides').first(),
            db.prepare('SELECT COUNT(*) as count FROM bookings').first(),
            db.prepare("SELECT COUNT(*) as count FROM reports WHERE status = 'pending'").first(),
        ]);

        return c.json({
            success: true,
            data: {
                total_users: totalUsers?.count || 0,
                total_rides: totalRides?.count || 0,
                total_bookings: totalBookings?.count || 0,
                pending_reports: pendingReports?.count || 0,
            },
        });

    } catch (error) {
        console.error('Get stats error:', error);
        return c.json({ success: false, error: 'خطا در دریافت آمار' }, 500);
    }
});

export default admin;

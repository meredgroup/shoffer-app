/**
 * Chat Routes
 * WebSocket connection management and conversation endpoints
 */

import { Hono } from 'hono';
import type { Env } from '../index';
import { authMiddleware } from '../middleware/auth';

const chat = new Hono<{ Bindings: Env }>();

// ============================================
// GET CONVERSATIONS LIST
// ============================================

chat.get('/conversations', authMiddleware, async (c) => {
    try {
        const userId = c.get('userId');

        // Get all conversations for user with last message
        const conversations = await c.env.DB.prepare(`
      SELECT DISTINCT
        CASE 
          WHEN m.sender_id = ? THEN m.receiver_id
          ELSE m.sender_id
        END as other_user_id,
        u.full_name as other_user_name,
        u.avatar_url as other_user_avatar,
        m.content as last_message,
        m.created_at as last_message_at,
        m.conversation_id,
        (SELECT COUNT(*) FROM messages 
         WHERE conversation_id = m.conversation_id 
         AND receiver_id = ? AND is_read = 0) as unread_count
      FROM messages m
      JOIN users u ON (
        CASE 
          WHEN m.sender_id = ? THEN m.receiver_id = u.id
          ELSE m.sender_id = u.id
        END
      )
      WHERE m.sender_id = ? OR m.receiver_id = ?
      GROUP BY m.conversation_id
      ORDER BY m.created_at DESC
      LIMIT 50
    `).bind(userId, userId, userId, userId, userId).all();

        return c.json({
            success: true,
            data: conversations.results,
        });

    } catch (error) {
        console.error('Get conversations error:', error);
        return c.json({ success: false, error: 'خطا در دریافت گفتگوها' }, 500);
    }
});

// ============================================
// GET WEBSOCKET URL
// ============================================

chat.get('/connect/:otherUserId', authMiddleware, async (c) => {
    try {
        const userId = c.get('userId');
        const { otherUserId } = c.req.param();

        // Get user info
        const user = await c.env.DB.prepare(
            'SELECT full_name FROM users WHERE id = ?'
        ).bind(userId).first();

        if (!user) {
            return c.json({ success: false, error: 'کاربر یافت نشد' }, 404);
        }

        // Create conversation ID (consistent ordering)
        const conversationId = [userId, otherUserId].sort().join('_');

        // Get Durable Object for this conversation
        const chatRoomId = c.env.CHAT.idFromName(conversationId);
        const chatRoom = c.env.CHAT.get(chatRoomId);

        // WebSocket URL (client will use this to connect)
        const wsUrl = `${c.env.ENVIRONMENT === 'production' ? 'wss' : 'ws'}://your-api-url/chat/ws?userId=${userId}&userName=${encodeURIComponent(user.full_name as string)}&otherUserId=${otherUserId}`;

        return c.json({
            success: true,
            data: {
                conversation_id: conversationId,
                ws_url: wsUrl,
                durable_object_id: chatRoomId.toString(),
            },
        });

    } catch (error) {
        console.error('Get WebSocket URL error:', error);
        return c.json({ success: false, error: 'خطا در ایجاد اتصال' }, 500);
    }
});

// ============================================
// WEBSOCKET ENDPOINT
// ============================================

chat.get('/ws', async (c) => {
    const url = new URL(c.req.url);
    const userId = url.searchParams.get('userId');
    const otherUserId = url.searchParams.get('otherUserId');

    if (!userId || !otherUserId) {
        return c.text('Missing parameters', 400);
    }

    const conversationId = [userId, otherUserId].sort().join('_');

    // Forward to Durable Object
    const chatRoomId = c.env.CHAT.idFromName(conversationId);
    const chatRoom = c.env.CHAT.get(chatRoomId);

    return chatRoom.fetch(c.req.raw);
});

// ============================================
// GET MESSAGE HISTORY
// ============================================

chat.get('/messages/:conversationId', authMiddleware, async (c) => {
    try {
        const userId = c.get('userId');
        const { conversationId } = c.req.param();
        const { limit = '50', before } = c.req.query();

        // Verify user is part of this conversation
        const userIds = conversationId.split('_');
        if (!userIds.includes(userId)) {
            return c.json({ success: false, error: 'دسترسی غیرمجاز' }, 403);
        }

        let query = `
      SELECT m.*, u.full_name as sender_name, u.avatar_url as sender_avatar
      FROM messages m
      JOIN users u ON m.sender_id = u.id
      WHERE m.conversation_id = ?
    `;

        const params: any[] = [conversationId];

        if (before) {
            query += ` AND m.created_at < ?`;
            params.push(parseInt(before));
        }

        query += ` ORDER BY m.created_at DESC LIMIT ?`;
        params.push(parseInt(limit));

        const results = await c.env.DB.prepare(query).bind(...params).all();

        return c.json({
            success: true,
            data: results.results.reverse(), // Oldest first
        });

    } catch (error) {
        console.error('Get messages error:', error);
        return c.json({ success: false, error: 'خطا در دریافت پیام‌ها' }, 500);
    }
});

export default chat;

/**
 * ChatRoom Durable Object
 * Handles WebSocket connections and real-time messaging for a conversation
 */

import { nanoid } from 'nanoid';

interface WebSocketClient {
    socket: WebSocket;
    userId: string;
    userName: string;
}

export class ChatRoom {
    private state: DurableObjectState;
    private env: any;
    private sessions: Set<WebSocketClient>;
    private conversationId: string;

    constructor(state: DurableObjectState, env: any) {
        this.state = state;
        this.env = env;
        this.sessions = new Set();
        this.conversationId = '';
    }

    async fetch(request: Request): Promise<Response> {
        const url = new URL(request.url);

        // WebSocket upgrade
        if (request.headers.get('Upgrade') === 'websocket') {
            return this.handleWebSocket(request);
        }

        // HTTP endpoints for message history
        if (url.pathname === '/messages' && request.method === 'GET') {
            return this.getMessages(request);
        }

        return new Response('Not found', { status: 404 });
    }

    private async handleWebSocket(request: Request): Promise<Response> {
        const url = new URL(request.url);
        const userId = url.searchParams.get('userId');
        const userName = url.searchParams.get('userName') || 'کاربر';
        const otherUserId = url.searchParams.get('otherUserId');

        if (!userId || !otherUserId) {
            return new Response('Missing userId or otherUserId', { status: 400 });
        }

        // Create conversation ID (consistent ordering)
        this.conversationId = [userId, otherUserId].sort().join('_');

        const pair = new WebSocketPair();
        const [client, server] = Object.values(pair);

        await this.handleSession(server, userId, userName);

        return new Response(null, {
            status: 101,
            webSocket: client,
        });
    }

    private async handleSession(socket: WebSocket, userId: string, userName: string): Promise<void> {
        socket.accept();

        const client: WebSocketClient = {
            socket,
            userId,
            userName,
        };

        this.sessions.add(client);

        // Send presence to all clients
        this.broadcast({
            type: 'presence',
            data: {
                userId,
                status: 'joined',
                activeUsers: Array.from(this.sessions).map(s => s.userId),
            },
            timestamp: Date.now(),
        }, null);

        socket.addEventListener('message', async (event) => {
            try {
                const data = JSON.parse(event.data as string);

                switch (data.type) {
                    case 'message':
                        await this.handleMessage(client, data);
                        break;
                    case 'typing':
                        this.handleTyping(client, data);
                        break;
                    case 'read':
                        await this.handleRead(client, data);
                        break;
                    default:
                        console.log('Unknown message type:', data.type);
                }
            } catch (error) {
                console.error('Message handling error:', error);
            }
        });

        socket.addEventListener('close', () => {
            this.sessions.delete(client);

            // Broadcast leave
            this.broadcast({
                type: 'presence',
                data: {
                    userId,
                    status: 'left',
                    activeUsers: Array.from(this.sessions).map(s => s.userId),
                },
                timestamp: Date.now(),
            }, null);
        });

        socket.addEventListener('error', (error) => {
            console.error('WebSocket error:', error);
            this.sessions.delete(client);
        });
    }

    private async handleMessage(client: WebSocketClient, data: any): Promise<void> {
        const { content, receiverId, contentType = 'text' } = data.data;

        if (!content || !receiverId) {
            return;
        }

        const db = this.env.DB as D1Database;
        const messageId = nanoid();
        const timestamp = Math.floor(Date.now() / 1000);

        // Save message to D1
        await db.prepare(`
      INSERT INTO messages (
        id, conversation_id, sender_id, receiver_id,
        content, content_type, is_read, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, 0, ?)
    `).bind(
            messageId,
            this.conversationId,
            client.userId,
            receiverId,
            content,
            contentType,
            timestamp
        ).run();

        // Broadcast to all connected clients
        const message = {
            type: 'message',
            data: {
                id: messageId,
                senderId: client.userId,
                senderName: client.userName,
                receiverId,
                content,
                contentType,
                isRead: false,
                createdAt: timestamp,
            },
            timestamp: Date.now(),
        };

        this.broadcast(message, null);

        // TODO: Send push notification if receiver is offline
    }

    private handleTyping(client: WebSocketClient, data: any): void {
        const { isTyping } = data.data;

        this.broadcast({
            type: 'typing',
            data: {
                userId: client.userId,
                userName: client.userName,
                isTyping,
            },
            timestamp: Date.now(),
        }, client.userId); // Don't send to self
    }

    private async handleRead(client: WebSocketClient, data: any): Promise<void> {
        const { messageId } = data.data;

        if (!messageId) return;

        const db = this.env.DB as D1Database;
        const timestamp = Math.floor(Date.now() / 1000);

        // Mark message as read
        await db.prepare(`
      UPDATE messages 
      SET is_read = 1, read_at = ?
      WHERE id = ? AND receiver_id = ?
    `).bind(timestamp, messageId, client.userId).run();

        // Broadcast read receipt
        this.broadcast({
            type: 'read',
            data: {
                messageId,
                readBy: client.userId,
                readAt: timestamp,
            },
            timestamp: Date.now(),
        }, null);
    }

    private broadcast(message: any, excludeUserId: string | null): void {
        const messageStr = JSON.stringify(message);

        for (const client of this.sessions) {
            if (excludeUserId && client.userId === excludeUserId) {
                continue;
            }

            try {
                client.socket.send(messageStr);
            } catch (error) {
                console.error('Broadcast error:', error);
                this.sessions.delete(client);
            }
        }
    }

    private async getMessages(request: Request): Promise<Response> {
        try {
            const url = new URL(request.url);
            const limit = parseInt(url.searchParams.get('limit') || '50');
            const before = url.searchParams.get('before'); // timestamp for pagination

            const db = this.env.DB as D1Database;

            let query = `
        SELECT m.*, u.full_name as sender_name, u.avatar_url as sender_avatar
        FROM messages m
        JOIN users u ON m.sender_id = u.id
        WHERE m.conversation_id = ?
      `;

            const params: any[] = [this.conversationId];

            if (before) {
                query += ` AND m.created_at < ?`;
                params.push(parseInt(before));
            }

            query += ` ORDER BY m.created_at DESC LIMIT ?`;
            params.push(limit);

            const results = await db.prepare(query).bind(...params).all();

            return Response.json({
                success: true,
                data: results.results.reverse(), // Oldest first
            });

        } catch (error) {
            console.error('Get messages error:', error);
            return Response.json(
                { success: false, error: 'خطا در دریافت پیام‌ها' },
                { status: 500 }
            );
        }
    }
}

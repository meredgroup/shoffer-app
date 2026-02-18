'use client';

import { useState, useEffect, useRef, use } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { formatTime } from '@/lib/jalali';

interface Message {
    id: string;
    sender_id: string;
    sender_name: string;
    content: string;
    created_at: number;
}

export const runtime = 'edge';

export default function ChatRoomPage({ params }: { params: Promise<{ conversationId: string }> }) {
    const { conversationId } = use(params);

    const [mounted, setMounted] = useState(false);
    const [messages, setMessages] = useState<Message[]>([]);
    const [newMessage, setNewMessage] = useState('');
    const [loading, setLoading] = useState(true);
    const [sending, setSending] = useState(false);
    const [otherUser, setOtherUser] = useState<{ name: string; avatar?: string } | null>(null);
    const [ws, setWs] = useState<WebSocket | null>(null);
    const [userId, setUserId] = useState<string>('');
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const router = useRouter();

    useEffect(() => {
        setMounted(true);
        const storedUserId = localStorage.getItem('userId');
        if (storedUserId) {
            setUserId(storedUserId);
        }
        loadMessages();
        connectWebSocket();

        return () => {
            if (ws) {
                ws.close();
            }
        };
    }, []);

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    const loadMessages = async () => {
        const token = localStorage.getItem('token');

        if (!token) {
            router.push('/auth/login');
            return;
        }

        try {
            const response = await fetch(
                `${process.env.NEXT_PUBLIC_API_URL}/chat/${conversationId}/messages`,
                {
                    headers: {
                        'Authorization': `Bearer ${token}`,
                    },
                }
            );

            const data = await response.json();

            if (data.success) {
                setMessages(data.data.messages || []);
                setOtherUser(data.data.other_user);
            }
        } catch (err) {
            console.error('Failed to load messages:', err);
        } finally {
            setLoading(false);
        }
    };

    const connectWebSocket = () => {
        const token = localStorage.getItem('token');
        if (!token) return;

        const wsUrl = process.env.NEXT_PUBLIC_WS_URL || 'ws://localhost:8787';
        const websocket = new WebSocket(`${wsUrl}/chat/ws/${conversationId}?token=${token}`);

        websocket.onopen = () => {
            console.log('WebSocket connected');
        };

        websocket.onmessage = (event) => {
            const data = JSON.parse(event.data);

            if (data.type === 'message') {
                setMessages((prev) => [...prev, data.message]);
            }
        };

        websocket.onerror = (error) => {
            console.error('WebSocket error:', error);
        };

        websocket.onclose = () => {
            console.log('WebSocket disconnected');
            // Attempt to reconnect after 3 seconds
            setTimeout(connectWebSocket, 3000);
        };

        setWs(websocket);
    };

    const handleSendMessage = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!newMessage.trim() || sending) return;

        setSending(true);

        try {
            if (ws && ws.readyState === WebSocket.OPEN) {
                ws.send(JSON.stringify({
                    type: 'message',
                    content: newMessage.trim(),
                }));

                setNewMessage('');
            }
        } catch (err) {
            console.error('Failed to send message:', err);
        } finally {
            setSending(false);
        }
    };



    if (!mounted || loading) {
        return (
            <div className="container" style={{ padding: 'var(--space-xl)' }}>
                <div className="skeleton skeleton-card" style={{ height: '600px' }}></div>
            </div>
        );
    }

    return (
        <div style={{
            minHeight: '100vh',
            backgroundColor: 'var(--bg-muted)',
            display: 'flex',
            flexDirection: 'column',
        }}>
            {/* Header */}
            <header style={{
                backgroundColor: 'var(--brand-anchor)',
                padding: 'var(--space-md)',
                boxShadow: 'var(--shadow-md)',
                position: 'sticky',
                top: 0,
                zIndex: 'var(--z-sticky)',
            }}>
                <div className="container flex items-center gap-md">
                    <Link href="/chat" style={{
                        color: '#FFFFFF',
                        fontSize: '1.5rem',
                        textDecoration: 'none',
                    }}>
                        ←
                    </Link>

                    <div style={{
                        width: '40px',
                        height: '40px',
                        borderRadius: '50%',
                        backgroundColor: 'rgba(255, 255, 255, 0.2)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '1.25rem',
                    }}>
                        👤
                    </div>

                    <h1 className="text-h3" style={{ color: '#FFFFFF', fontWeight: '700' }}>
                        {otherUser?.name || 'گفتگو'}
                    </h1>
                </div>
            </header>

            {/* Messages */}
            <div style={{
                flex: 1,
                overflowY: 'auto',
                padding: 'var(--space-md)',
                paddingBottom: '100px',
            }}>
                <div className="container" style={{
                    maxWidth: '800px',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 'var(--space-sm)',
                }}>
                    {messages.length === 0 ? (
                        <div style={{
                            textAlign: 'center',
                            padding: 'var(--space-2xl)',
                            color: 'var(--text-muted)',
                        }}>
                            <div style={{ fontSize: '3rem', marginBottom: 'var(--space-md)' }}>💬</div>
                            <p className="text-body">هنوز پیامی ارسال نشده است</p>
                        </div>
                    ) : (
                        messages.map((message) => {
                            const isMe = message.sender_id === userId;

                            return (
                                <div
                                    key={message.id}
                                    style={{
                                        display: 'flex',
                                        justifyContent: isMe ? 'flex-end' : 'flex-start',
                                        marginBottom: 'var(--space-xs)',
                                    }}
                                >
                                    <div style={{
                                        maxWidth: '70%',
                                        padding: 'var(--space-md)',
                                        borderRadius: 'var(--radius-md)',
                                        backgroundColor: isMe ? 'var(--ui-primary)' : '#FFFFFF',
                                        color: isMe ? '#FFFFFF' : 'var(--text-primary)',
                                        boxShadow: 'var(--shadow-sm)',
                                    }}>
                                        <p className="text-body" style={{
                                            marginBottom: 'var(--space-xs)',
                                            wordWrap: 'break-word',
                                        }}>
                                            {message.content}
                                        </p>
                                        <div className="text-caption" style={{
                                            opacity: 0.7,
                                            textAlign: 'left',
                                        }}>
                                            {formatTime(message.created_at)}
                                        </div>
                                    </div>
                                </div>
                            );
                        })
                    )}
                    <div ref={messagesEndRef} />
                </div>
            </div>

            {/* Input */}
            <div style={{
                position: 'fixed',
                bottom: 0,
                left: 0,
                right: 0,
                backgroundColor: '#FFFFFF',
                borderTop: '1px solid var(--border-default)',
                padding: 'var(--space-md)',
                boxShadow: 'var(--shadow-md)',
            }}>
                <form onSubmit={handleSendMessage} className="container" style={{
                    maxWidth: '800px',
                    display: 'flex',
                    gap: 'var(--space-sm)',
                }}>
                    <input
                        type="text"
                        className="input"
                        value={newMessage}
                        onChange={(e) => setNewMessage(e.target.value)}
                        placeholder="پیام خود را بنویسید..."
                        disabled={sending}
                        style={{ flex: 1 }}
                    />
                    <button
                        type="submit"
                        className="btn btn-primary"
                        disabled={!newMessage.trim() || sending}
                        style={{ minWidth: '80px' }}
                    >
                        {sending ? '...' : 'ارسال'}
                    </button>
                </form>
            </div>
        </div>
    );
}

'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { getRelativeTime } from '@/lib/jalali';

interface Conversation {
    id: string;
    other_user_id: string;
    other_user_name: string;
    other_user_avatar?: string;
    last_message: string;
    last_message_time: number;
    unread_count: number;
    ride_origin: string;
    ride_destination: string;
}

export default function ChatListPage() {
    const [mounted, setMounted] = useState(false);
    const [conversations, setConversations] = useState<Conversation[]>([]);
    const [loading, setLoading] = useState(true);
    const router = useRouter();

    useEffect(() => {
        setMounted(true);
        loadConversations();
    }, []);

    const loadConversations = async () => {
        const token = localStorage.getItem('token');

        if (!token) {
            router.push('/auth/login');
            return;
        }

        try {
            const response = await fetch(
                `${process.env.NEXT_PUBLIC_API_URL}/chat/conversations`,
                {
                    headers: {
                        'Authorization': `Bearer ${token}`,
                    },
                }
            );

            const data = await response.json();

            if (data.success) {
                setConversations(data.data || []);
            }
        } catch (err) {
            console.error('Failed to load conversations:', err);
        } finally {
            setLoading(false);
        }
    };



    if (!mounted) {
        return (
            <div className="container" style={{ padding: 'var(--space-xl)' }}>
                <div className="skeleton skeleton-card" style={{ height: '600px' }}></div>
            </div>
        );
    }

    return (
        <div style={{ minHeight: '100vh', backgroundColor: 'var(--bg-main)', paddingBottom: '100px' }}>
            {/* Header */}
            <header style={{
                backgroundColor: 'var(--brand-anchor)',
                padding: 'var(--space-md)',
                boxShadow: 'var(--shadow-md)',
                position: 'sticky',
                top: 0,
                zIndex: 'var(--z-sticky)',
            }}>
                <div className="container flex items-center justify-between">
                    <h1 className="text-h2" style={{ color: '#FFFFFF', fontWeight: '700' }}>
                        گفتگوها
                    </h1>
                    <Link href="/dashboard" className="btn btn-ghost" style={{ color: '#FFFFFF' }}>
                        داشبورد
                    </Link>
                </div>
            </header>

            <div className="container" style={{ padding: 'var(--space-xl) var(--space-md)' }}>
                {loading ? (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-md)' }}>
                        {[1, 2, 3, 4].map((i) => (
                            <div key={i} className="skeleton skeleton-card" style={{ height: '100px' }}></div>
                        ))}
                    </div>
                ) : conversations.length === 0 ? (
                    <div className="card" style={{ textAlign: 'center', padding: 'var(--space-2xl)' }}>
                        <div style={{ fontSize: '4rem', marginBottom: 'var(--space-md)' }}>💬</div>
                        <h3 className="text-h3 mb-sm">گفتگویی وجود ندارد</h3>
                        <p className="text-body" style={{ color: 'var(--text-secondary)', marginBottom: 'var(--space-lg)' }}>
                            هنوز با کسی گفتگو نکرده‌اید
                        </p>
                        <Link href="/search" className="btn btn-primary">
                            جستجوی سفر
                        </Link>
                    </div>
                ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-sm)' }}>
                        {conversations.map((conv) => (
                            <Link
                                key={conv.id}
                                href={`/chat/${conv.id}`}
                                className="card card-interactive"
                                style={{
                                    textDecoration: 'none',
                                    color: 'inherit',
                                    position: 'relative',
                                }}
                            >
                                <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-md)' }}>
                                    {/* Avatar */}
                                    <div style={{
                                        width: '60px',
                                        height: '60px',
                                        borderRadius: '50%',
                                        backgroundColor: 'var(--bg-muted)',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        fontSize: '2rem',
                                        flexShrink: 0,
                                        position: 'relative',
                                    }}>
                                        👤
                                        {conv.unread_count > 0 && (
                                            <div style={{
                                                position: 'absolute',
                                                top: 0,
                                                right: 0,
                                                width: '24px',
                                                height: '24px',
                                                borderRadius: '50%',
                                                backgroundColor: 'var(--error-text)',
                                                color: '#FFFFFF',
                                                display: 'flex',
                                                alignItems: 'center',
                                                justifyContent: 'center',
                                                fontSize: '0.75rem',
                                                fontWeight: '700',
                                            }}>
                                                {conv.unread_count > 9 ? '9+' : conv.unread_count}
                                            </div>
                                        )}
                                    </div>

                                    {/* Content */}
                                    <div style={{ flex: 1, minWidth: 0 }}>
                                        <div style={{
                                            display: 'flex',
                                            justifyContent: 'space-between',
                                            alignItems: 'center',
                                            marginBottom: 'var(--space-xs)',
                                        }}>
                                            <h3 className="text-body" style={{
                                                fontWeight: conv.unread_count > 0 ? '700' : '600',
                                            }}>
                                                {conv.other_user_name}
                                            </h3>
                                            <span className="text-caption" style={{ flexShrink: 0 }}>
                                                {getRelativeTime(conv.last_message_time)}
                                            </span>
                                        </div>

                                        <div className="text-caption" style={{
                                            color: 'var(--text-muted)',
                                            marginBottom: 'var(--space-xs)',
                                        }}>
                                            {conv.ride_origin} → {conv.ride_destination}
                                        </div>

                                        <p className="text-body-sm" style={{
                                            color: conv.unread_count > 0 ? 'var(--text-primary)' : 'var(--text-secondary)',
                                            fontWeight: conv.unread_count > 0 ? '600' : '400',
                                            overflow: 'hidden',
                                            textOverflow: 'ellipsis',
                                            whiteSpace: 'nowrap',
                                        }}>
                                            {conv.last_message}
                                        </p>
                                    </div>
                                </div>
                            </Link>
                        ))}
                    </div>
                )}
            </div>

            {/* Bottom Navigation */}
            <nav className="bottom-nav">
                <Link href="/" className="bottom-nav-item">
                    <span className="bottom-nav-icon">🏠</span>
                    <span>خانه</span>
                </Link>
                <Link href="/search" className="bottom-nav-item">
                    <span className="bottom-nav-icon">🔍</span>
                    <span>جستجو</span>
                </Link>
                <Link href="/bookings" className="bottom-nav-item">
                    <span className="bottom-nav-icon">🎫</span>
                    <span>رزروها</span>
                </Link>
                <Link href="/chat" className="bottom-nav-item active">
                    <span className="bottom-nav-icon">💬</span>
                    <span>چت</span>
                </Link>
                <Link href="/dashboard" className="bottom-nav-item">
                    <span className="bottom-nav-icon">👤</span>
                    <span>پروفایل</span>
                </Link>
            </nav>
        </div>
    );
}

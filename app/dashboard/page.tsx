'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

interface User {
    id: string;
    full_name: string;
    email: string;
    avatar_url?: string;
    rating: number;
    total_ratings: number;
    is_driver: boolean;
}

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8787';

export default function DashboardPage() {
    const [mounted, setMounted] = useState(false);
    const [user, setUser] = useState<User | null>(null);
    const [loading, setLoading] = useState(true);
    const router = useRouter();

    useEffect(() => {
        setMounted(true);
        loadUser();
    }, []);

    const loadUser = async () => {
        const token = localStorage.getItem('token');

        if (!token) {
            router.push('/auth/login');
            return;
        }

        try {
            const response = await fetch(
                `${API_URL}/auth/me`,
                {
                    headers: {
                        'Authorization': `Bearer ${token}`,
                    },
                }
            );

            const data = await response.json();

            if (data.success) {
                setUser(data.data);
            } else {
                // Token invalid, redirect to login
                localStorage.removeItem('token');
                localStorage.removeItem('userId');
                router.push('/auth/login');
            }
        } catch (err) {
            console.error('Failed to load user:', err);
        } finally {
            setLoading(false);
        }
    };

    const handleLogout = () => {
        localStorage.removeItem('token');
        localStorage.removeItem('userId');
        router.push('/');
    };

    if (!mounted || loading) {
        return (
            <div className="container" style={{ padding: 'var(--space-xl)' }}>
                <div className="skeleton skeleton-card" style={{ height: '400px' }}></div>
            </div>
        );
    }

    if (!user) return null;

    return (
        <div style={{ minHeight: '100vh', backgroundColor: 'var(--bg-main)', paddingBottom: '100px' }}>
            {/* Header */}
            <header style={{
                backgroundColor: 'var(--brand-anchor)',
                padding: 'var(--space-xl) var(--space-md)',
                color: '#FFFFFF',
            }}>
                <div className="container">
                    <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-lg)' }}>
                        <div style={{
                            width: '80px',
                            height: '80px',
                            borderRadius: '50%',
                            backgroundColor: 'rgba(255, 255, 255, 0.2)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontSize: '2.5rem',
                        }}>
                            👤
                        </div>

                        <div style={{ flex: 1 }}>
                            <h1 className="text-h2" style={{ marginBottom: 'var(--space-xs)' }}>
                                {user.full_name}
                            </h1>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-md)' }}>
                                <span className="text-body-sm" style={{ opacity: 0.9 }}>
                                    {user.email}
                                </span>
                                {user.is_driver && (
                                    <span className="badge" style={{
                                        backgroundColor: 'var(--cta-primary)',
                                        color: '#FFFFFF',
                                    }}>
                                        🚗 راننده
                                    </span>
                                )}
                            </div>

                            {user.total_ratings > 0 && (
                                <div style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: 'var(--space-xs)',
                                    marginTop: 'var(--space-sm)',
                                }}>
                                    <span style={{ color: 'var(--star-filled)' }}>⭐</span>
                                    <span className="text-body">
                                        {user.rating.toFixed(1)}
                                    </span>
                                    <span className="text-body-sm" style={{ opacity: 0.8 }}>
                                        ({user.total_ratings} نظر)
                                    </span>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </header>

            <div className="container" style={{ padding: 'var(--space-xl) var(--space-md)' }}>
                {/* Quick Actions */}
                <div style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
                    gap: 'var(--space-md)',
                    marginBottom: 'var(--space-2xl)',
                }}>
                    <Link href="/search" className="card card-interactive" style={{
                        textAlign: 'center',
                        textDecoration: 'none',
                        color: 'inherit',
                        padding: 'var(--space-lg)',
                    }}>
                        <div style={{ fontSize: '2.5rem', marginBottom: 'var(--space-sm)' }}>🔍</div>
                        <div className="text-body" style={{ fontWeight: '600' }}>
                            جستجوی سفر
                        </div>
                    </Link>

                    <Link href="/bookings" className="card card-interactive" style={{
                        textAlign: 'center',
                        textDecoration: 'none',
                        color: 'inherit',
                        padding: 'var(--space-lg)',
                    }}>
                        <div style={{ fontSize: '2.5rem', marginBottom: 'var(--space-sm)' }}>🎫</div>
                        <div className="text-body" style={{ fontWeight: '600' }}>
                            رزروهای من
                        </div>
                    </Link>

                    <Link href="/favorites" className="card card-interactive" style={{
                        textAlign: 'center',
                        textDecoration: 'none',
                        color: 'inherit',
                        padding: 'var(--space-lg)',
                    }}>
                        <div style={{ fontSize: '2.5rem', marginBottom: 'var(--space-sm)' }}>💖</div>
                        <div className="text-body" style={{ fontWeight: '600' }}>
                            رانندگان مورد علاقه
                        </div>
                    </Link>

                    <Link href="/trip-requests/my" className="card card-interactive" style={{
                        textAlign: 'center',
                        textDecoration: 'none',
                        color: 'inherit',
                        padding: 'var(--space-lg)',
                    }}>
                        <div style={{ fontSize: '2.5rem', marginBottom: 'var(--space-sm)' }}>📋</div>
                        <div className="text-body" style={{ fontWeight: '600' }}>
                            درخواست‌های سفر
                        </div>
                    </Link>

                    <Link href="/chat" className="card card-interactive" style={{
                        textAlign: 'center',
                        textDecoration: 'none',
                        color: 'inherit',
                        padding: 'var(--space-lg)',
                    }}>
                        <div style={{ fontSize: '2.5rem', marginBottom: 'var(--space-sm)' }}>💬</div>
                        <div className="text-body" style={{ fontWeight: '600' }}>
                            گفتگوها
                        </div>
                    </Link>
                </div>

                {/* Driver Section */}
                {user.is_driver && (
                    <div className="card mb-xl" style={{
                        background: 'linear-gradient(135deg, var(--cta-primary-soft) 0%, var(--ui-primary-soft) 100%)',
                        border: '2px solid var(--cta-primary)',
                    }}>
                        <h2 className="text-h2 mb-lg">پنل راننده</h2>

                        <div style={{
                            display: 'grid',
                            gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                            gap: 'var(--space-md)',
                        }}>
                            <Link href="/drive/create-ride" className="btn btn-cta btn-lg">
                                ➕ ایجاد سفر جدید
                            </Link>

                            <Link href="/drive/my-rides" className="btn btn-primary btn-lg">
                                📋 سفرهای من
                            </Link>

                            <Link href="/drive/vehicles" className="btn btn-secondary btn-lg">
                                🚗 خودروهای من
                            </Link>
                        </div>
                    </div>
                )}

                {/* Menu Items */}
                <div className="card mb-lg">
                    <h3 className="text-h3 mb-md">تنظیمات و اطلاعات</h3>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-sm)' }}>
                        <Link href="/profile/edit" style={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            padding: 'var(--space-md)',
                            textDecoration: 'none',
                            color: 'inherit',
                            borderRadius: 'var(--radius-md)',
                            transition: 'background-color var(--transition-fast)',
                        }}
                            onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'var(--bg-muted)'}
                            onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                        >
                            <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-md)' }}>
                                <span style={{ fontSize: '1.5rem' }}>✏️</span>
                                <span className="text-body">ویرایش پروفایل</span>
                            </div>
                            <span style={{ color: 'var(--text-muted)' }}>←</span>
                        </Link>

                        {!user.is_driver && (
                            <Link href="/become-driver" style={{
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'space-between',
                                padding: 'var(--space-md)',
                                textDecoration: 'none',
                                color: 'inherit',
                                borderRadius: 'var(--radius-md)',
                                backgroundColor: 'var(--cta-primary-soft)',
                            }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-md)' }}>
                                    <span style={{ fontSize: '1.5rem' }}>🚗</span>
                                    <span className="text-body" style={{ fontWeight: '600', color: 'var(--cta-primary)' }}>
                                        راننده شوید
                                    </span>
                                </div>
                                <span style={{ color: 'var(--cta-primary)' }}>←</span>
                            </Link>
                        )}

                        <Link href="/help" style={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            padding: 'var(--space-md)',
                            textDecoration: 'none',
                            color: 'inherit',
                            borderRadius: 'var(--radius-md)',
                            transition: 'background-color var(--transition-fast)',
                        }}
                            onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'var(--bg-muted)'}
                            onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                        >
                            <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-md)' }}>
                                <span style={{ fontSize: '1.5rem' }}>❓</span>
                                <span className="text-body">راهنما و پشتیبانی</span>
                            </div>
                            <span style={{ color: 'var(--text-muted)' }}>←</span>
                        </Link>

                        <Link href="/about" style={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            padding: 'var(--space-md)',
                            textDecoration: 'none',
                            color: 'inherit',
                            borderRadius: 'var(--radius-md)',
                            transition: 'background-color var(--transition-fast)',
                        }}
                            onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'var(--bg-muted)'}
                            onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                        >
                            <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-md)' }}>
                                <span style={{ fontSize: '1.5rem' }}>ℹ️</span>
                                <span className="text-body">درباره شوفر</span>
                            </div>
                            <span style={{ color: 'var(--text-muted)' }}>←</span>
                        </Link>
                    </div>
                </div>

                {/* Logout Button */}
                <button
                    onClick={handleLogout}
                    className="btn btn-outline w-full"
                    style={{
                        color: 'var(--error-text)',
                        borderColor: 'var(--error-text)',
                    }}
                >
                    🚪 خروج از حساب کاربری
                </button>
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
                <Link href="/chat" className="bottom-nav-item">
                    <span className="bottom-nav-icon">💬</span>
                    <span>چت</span>
                </Link>
                <Link href="/dashboard" className="bottom-nav-item active">
                    <span className="bottom-nav-icon">👤</span>
                    <span>پروفایل</span>
                </Link>
            </nav>
        </div>
    );
}

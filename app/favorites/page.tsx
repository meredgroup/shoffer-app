'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

interface FavoriteDriver {
    id: string;
    full_name: string;
    avatar_url?: string;
    rating: number;
    total_ratings: number;
    total_trips: number;
}

export default function FavoritesPage() {
    const [mounted, setMounted] = useState(false);
    const [favorites, setFavorites] = useState<FavoriteDriver[]>([]);
    const [loading, setLoading] = useState(true);
    const router = useRouter();

    useEffect(() => {
        setMounted(true);
        loadFavorites();
    }, []);

    const loadFavorites = async () => {
        const token = localStorage.getItem('token');

        if (!token) {
            router.push('/auth/login');
            return;
        }

        try {
            const response = await fetch(
                `${process.env.NEXT_PUBLIC_API_URL}/users/favorites`,
                {
                    headers: {
                        'Authorization': `Bearer ${token}`,
                    },
                }
            );

            const data = await response.json();

            if (data.success) {
                setFavorites(data.data || []);
            }
        } catch (err) {
            console.error('Failed to load favorites:', err);
        } finally {
            setLoading(false);
        }
    };

    const handleRemoveFavorite = async (driverId: string) => {
        const token = localStorage.getItem('token');
        if (!token) return;

        try {
            const response = await fetch(
                `${process.env.NEXT_PUBLIC_API_URL}/users/favorites/${driverId}`,
                {
                    method: 'DELETE',
                    headers: {
                        'Authorization': `Bearer ${token}`,
                    },
                }
            );

            const data = await response.json();

            if (data.success) {
                setFavorites(favorites.filter(f => f.id !== driverId));
            }
        } catch (err) {
            console.error('Failed to remove favorite:', err);
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
                        رانندگان مورد علاقه
                    </h1>
                    <Link href="/dashboard" className="btn btn-ghost" style={{ color: '#FFFFFF' }}>
                        داشبورد
                    </Link>
                </div>
            </header>

            <div className="container" style={{ padding: 'var(--space-xl) var(--space-md)' }}>
                {/* Create Trip Request CTA */}
                <div className="card mb-xl" style={{
                    background: 'linear-gradient(135deg, var(--ui-primary-soft) 0%, var(--cta-primary-soft) 100%)',
                    border: '2px solid var(--ui-primary)',
                }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-md)' }}>
                        <div style={{
                            fontSize: '3rem',
                            flexShrink: 0,
                        }}>
                            📢
                        </div>
                        <div style={{ flex: 1 }}>
                            <h3 className="text-h3 mb-sm">
                                درخواست سفر به رانندگان مورد علاقه
                            </h3>
                            <p className="text-body-sm" style={{ color: 'var(--text-secondary)' }}>
                                نیاز به یک سفر خاص دارید؟ درخواست خود را ارسال کنید
                            </p>
                        </div>
                        <Link href="/trip-requests/create" className="btn btn-primary">
                            ➕ ایجاد درخواست
                        </Link>
                    </div>
                </div>

                {/* Favorites List */}
                {loading ? (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-md)' }}>
                        {[1, 2, 3].map((i) => (
                            <div key={i} className="skeleton skeleton-card" style={{ height: '120px' }}></div>
                        ))}
                    </div>
                ) : favorites.length === 0 ? (
                    <div className="card" style={{ textAlign: 'center', padding: 'var(--space-2xl)' }}>
                        <div style={{ fontSize: '4rem', marginBottom: 'var(--space-md)' }}>💖</div>
                        <h3 className="text-h3 mb-sm">هنوز راننده‌ای اضافه نکرده‌اید</h3>
                        <p className="text-body" style={{ color: 'var(--text-secondary)', marginBottom: 'var(--space-lg)' }}>
                            رانندگان خوب را به لیست علاقه‌مندی‌های خود اضافه کنید
                        </p>
                        <Link href="/search" className="btn btn-primary">
                            جستجوی سفر
                        </Link>
                    </div>
                ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-md)' }}>
                        {favorites.map((driver) => (
                            <div key={driver.id} className="card">
                                <div style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: 'var(--space-md)',
                                }}>
                                    {/* Avatar */}
                                    <div style={{
                                        width: '80px',
                                        height: '80px',
                                        borderRadius: '50%',
                                        backgroundColor: 'var(--bg-muted)',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        fontSize: '2.5rem',
                                        flexShrink: 0,
                                    }}>
                                        👤
                                    </div>

                                    {/* Info */}
                                    <div style={{ flex: 1 }}>
                                        <h3 className="text-h3" style={{ marginBottom: 'var(--space-xs)' }}>
                                            {driver.full_name}
                                        </h3>

                                        <div style={{
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: 'var(--space-md)',
                                            marginBottom: 'var(--space-sm)',
                                        }}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-xs)' }}>
                                                <span style={{ color: 'var(--star-filled)' }}>⭐</span>
                                                <span className="text-body">
                                                    {driver.rating.toFixed(1)}
                                                </span>
                                                <span className="text-caption">
                                                    ({driver.total_ratings} نظر)
                                                </span>
                                            </div>

                                            <div className="text-body-sm">
                                                🚗 {driver.total_trips} سفر
                                            </div>
                                        </div>

                                        <div style={{
                                            display: 'flex',
                                            gap: 'var(--space-sm)',
                                            flexWrap: 'wrap',
                                        }}>
                                            <Link
                                                href={`/driver/${driver.id}`}
                                                className="btn btn-outline btn-sm"
                                            >
                                                مشاهده پروفایل
                                            </Link>

                                            <button
                                                onClick={() => handleRemoveFavorite(driver.id)}
                                                className="btn btn-ghost btn-sm"
                                                style={{ color: 'var(--error-text)' }}
                                            >
                                                💔 حذف
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </div>
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
                <Link href="/chat" className="bottom-nav-item">
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

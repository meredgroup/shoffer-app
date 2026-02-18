'use client';

import { useState, useEffect, use } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { formatJalaliDate, toPersianNumber } from '@/lib/jalali';

export default function DriverProfilePage({ params }: { params: Promise<{ id: string }> }) {
    const { id: userId } = use(params);
    const [mounted, setMounted] = useState(false);
    const [driver, setDriver] = useState<any>(null);
    const [ratings, setRatings] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [isFollowed, setIsFollowed] = useState(false);
    const router = useRouter();

    useEffect(() => {
        setMounted(true);
        loadProfile();
    }, [userId]);

    const loadProfile = async () => {
        setLoading(true);
        try {
            const [profileRes, ratingsRes] = await Promise.all([
                fetch(`${process.env.NEXT_PUBLIC_API_URL}/users/${userId}`),
                fetch(`${process.env.NEXT_PUBLIC_API_URL}/users/${userId}/ratings`)
            ]);

            const profileData = await profileRes.json();
            const ratingsData = await ratingsRes.json();

            if (profileData.success) {
                setDriver(profileData.data);
            } else {
                setError('پروفایل یافت نشد');
            }

            if (ratingsData.success) {
                setRatings(ratingsData.data || []);
            }
        } catch (err) {
            setError('خطا در دریافت اطلاعات');
        } finally {
            setLoading(false);
        }
    };

    const handleFollow = async () => {
        const token = localStorage.getItem('token');
        if (!token) {
            router.push('/auth/login');
            return;
        }

        try {
            const method = isFollowed ? 'DELETE' : 'POST';
            const response = await fetch(
                `${process.env.NEXT_PUBLIC_API_URL}/users/follow/${userId}`,
                {
                    method: method,
                    headers: { 'Authorization': `Bearer ${token}` }
                }
            );
            const data = await response.json();
            if (data.success) {
                setIsFollowed(!isFollowed);
            }
        } catch (err) {
            console.error('Follow error:', err);
        }
    };

    if (!mounted) return null;

    if (loading) {
        return (
            <div className="container" style={{ padding: 'var(--space-xl)' }}>
                <div className="skeleton skeleton-card" style={{ height: '200px', marginBottom: 'var(--space-lg)' }}></div>
                <div className="skeleton skeleton-card" style={{ height: '400px' }}></div>
            </div>
        );
    }

    if (error || !driver) {
        return (
            <div style={{ minHeight: '100vh', backgroundColor: 'var(--bg-main)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <div className="card" style={{ textAlign: 'center' }}>
                    <p className="text-error mb-lg">{error || 'خطا در بارگذاری'}</p>
                    <Link href="/" className="btn btn-primary">بازگشت به خانه</Link>
                </div>
            </div>
        );
    }

    return (
        <div style={{ minHeight: '100vh', backgroundColor: 'var(--bg-main)', paddingBottom: '100px' }}>
            {/* Header / Cover */}
            <div style={{
                height: '160px',
                backgroundColor: 'var(--brand-anchor)',
                position: 'relative'
            }}>
                <Link href="/" style={{
                    position: 'absolute',
                    top: 'var(--space-md)',
                    right: 'var(--space-md)',
                    color: '#FFFFFF',
                    textDecoration: 'none',
                    fontSize: '1.5rem',
                    zIndex: 10
                }}>←</Link>
            </div>

            <div className="container" style={{ marginTop: '-60px', padding: '0 var(--space-md)' }}>
                {/* Profile Info */}
                <div className="card" style={{ textAlign: 'center', marginBottom: 'var(--space-lg)' }}>
                    <div style={{
                        width: '120px',
                        height: '120px',
                        borderRadius: '50%',
                        backgroundColor: '#FFFFFF',
                        border: '4px solid #FFFFFF',
                        boxShadow: 'var(--shadow-md)',
                        margin: '0 auto var(--space-md)',
                        overflow: 'hidden',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '4rem'
                    }}>
                        {driver.avatar_url ? <img src={driver.avatar_url} alt={driver.full_name} /> : '👤'}
                    </div>

                    <h1 className="text-h1 mb-xs">{driver.full_name}</h1>
                    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 'var(--space-md)', marginBottom: 'var(--space-md)' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-xs)' }}>
                            <span style={{ color: 'var(--star-filled)', fontSize: '1.25rem' }}>⭐</span>
                            <span className="text-h3">{toPersianNumber(driver.rating.toFixed(1))}</span>
                            <span className="text-caption">({toPersianNumber(driver.total_ratings)} نظر)</span>
                        </div>
                        <span style={{ color: 'var(--border-default)' }}>|</span>
                        <div className="text-body-sm" style={{ color: 'var(--text-secondary)' }}>
                            عضویت از {formatJalaliDate(driver.created_at * 1000)}
                        </div>
                    </div>

                    <p className="text-body mb-lg" style={{ maxWidth: '600px', margin: '0 auto var(--space-lg)' }}>
                        {driver.bio || 'توضیحاتی برای این راننده ثبت نشده است.'}
                    </p>

                    <div style={{ display: 'flex', gap: 'var(--space-md)', justifyContent: 'center' }}>
                        <button onClick={handleFollow} className={`btn ${isFollowed ? 'btn-outline' : 'btn-primary'}`} style={{ minWidth: '150px' }}>
                            {isFollowed ? '✓ دنبال شده' : '➕ دنبال کردن'}
                        </button>
                        <Link href={`/chat/${driver.id}`} className="btn btn-cta" style={{ minWidth: '150px' }}>
                            💬 ارسال پیام
                        </Link>
                    </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 'var(--space-lg)' }}>
                    {/* Vehicles */}
                    <div className="card">
                        <h2 className="text-h3 mb-lg">🚗 خودروها</h2>
                        {driver.vehicles?.length > 0 ? (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-md)' }}>
                                {driver.vehicles.map((v: any) => (
                                    <div key={v.id} style={{
                                        padding: 'var(--space-md)',
                                        backgroundColor: 'var(--bg-muted)',
                                        borderRadius: 'var(--radius-md)',
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: 'var(--space-md)'
                                    }}>
                                        <div style={{ fontSize: '2rem' }}>🚗</div>
                                        <div>
                                            <div className="text-body" style={{ fontWeight: '600' }}>{v.make} {v.model}</div>
                                            <div className="text-caption">{v.color} • {toPersianNumber(v.year)}</div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <p className="text-body-sm" style={{ color: 'var(--text-secondary)' }}>خودرویی ثبت نشده است.</p>
                        )}
                    </div>

                    {/* Ratings/Reviews */}
                    <div className="card">
                        <h2 className="text-h3 mb-lg">💬 نظرات کاربران</h2>
                        {ratings.length > 0 ? (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-lg)' }}>
                                {ratings.map((r: any) => (
                                    <div key={r.id} style={{ borderBottom: '1px solid var(--border-default)', paddingBottom: 'var(--space-md)' }}>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 'var(--space-xs)' }}>
                                            <div className="text-body-sm" style={{ fontWeight: '600' }}>{r.reviewer_name}</div>
                                            <div style={{ display: 'flex', gap: '2px' }}>
                                                {[...Array(5)].map((_, i) => (
                                                    <span key={i} style={{ color: i < r.stars ? 'var(--star-filled)' : 'var(--border-default)', fontSize: '0.8rem' }}>★</span>
                                                ))}
                                            </div>
                                        </div>
                                        <p className="text-body-sm mb-xs">{r.review_text || 'بدون توضیح'}</p>
                                        <div className="text-caption">{formatJalaliDate(r.created_at * 1000)}</div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <p className="text-body-sm" style={{ color: 'var(--text-secondary)' }}>نظری ثبت نشده است.</p>
                        )}
                    </div>
                </div>
            </div>

            {/* Bottom Nav */}
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

'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { formatJalaliDateTime, formatPrice, toPersianNumber } from '@/lib/jalali';

interface Ride {
    id: string;
    slug: string;
    origin_city: string;
    destination_city: string;
    departure_time: number;
    price_per_seat: number;
    available_seats: number;
    total_seats: number;
    status: 'ACTIVE' | 'COMPLETED' | 'CANCELLED';
    booking_count: number;
}

export default function MyRidesPage() {
    const [mounted, setMounted] = useState(false);
    const [rides, setRides] = useState<Ride[]>([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState<string>('active');
    const router = useRouter();
    const searchParams = useSearchParams();

    useEffect(() => {
        setMounted(true);
        loadRides();
    }, [filter]);

    const loadRides = async () => {
        const token = localStorage.getItem('token');

        if (!token) {
            router.push('/auth/login');
            return;
        }

        setLoading(true);
        try {
            const params = new URLSearchParams();
            if (filter !== 'all') {
                params.append('status', filter.toUpperCase());
            }

            const response = await fetch(
                `${process.env.NEXT_PUBLIC_API_URL}/rides/my?${params.toString()}`,
                {
                    headers: {
                        'Authorization': `Bearer ${token}`,
                    },
                }
            );

            const data = await response.json();

            if (data.success) {
                setRides(data.data || []);
            }
        } catch (err) {
            console.error('Failed to load rides:', err);
        } finally {
            setLoading(false);
        }
    };

    const handleCancelRide = async (rideId: string) => {
        if (!confirm('آیا مطمئن هستید که می‌خواهید این سفر را لغو کنید؟')) {
            return;
        }

        const token = localStorage.getItem('token');
        if (!token) return;

        try {
            const response = await fetch(
                `${process.env.NEXT_PUBLIC_API_URL}/rides/${rideId}`,
                {
                    method: 'DELETE',
                    headers: {
                        'Authorization': `Bearer ${token}`,
                    },
                }
            );

            const data = await response.json();

            if (data.success) {
                loadRides(); // Refresh the list
            }
        } catch (err) {
            console.error('Failed to cancel ride:', err);
        }
    };

    const getStatusBadge = (status: string) => {
        const badges: Record<string, { class: string; text: string; icon: string }> = {
            ACTIVE: { class: 'badge-success', text: 'فعال', icon: '✓' },
            COMPLETED: { class: 'badge-primary', text: 'تکمیل شده', icon: '🎉' },
            CANCELLED: { class: 'badge-error', text: 'لغو شده', icon: '✗' },
        };

        const badge = badges[status] || badges.ACTIVE;
        return (
            <span className={`badge ${badge.class}`}>
                {badge.icon} {badge.text}
            </span>
        );
    };

    if (!mounted) {
        return (
            <div className="container" style={{ padding: 'var(--space-xl)' }}>
                <div className="skeleton skeleton-card" style={{ height: '600px' }}></div>
            </div>
        );
    }

    const newRide = searchParams.get('new');

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
                        سفرهای من
                    </h1>
                    <Link href="/dashboard" className="btn btn-ghost" style={{ color: '#FFFFFF' }}>
                        داشبورد
                    </Link>
                </div>
            </header>

            <div className="container" style={{ padding: 'var(--space-xl) var(--space-md)' }}>
                {/* Success Message */}
                {newRide === 'true' && (
                    <div style={{
                        padding: 'var(--space-lg)',
                        backgroundColor: 'var(--success-bg)',
                        color: 'var(--success-text)',
                        borderRadius: 'var(--radius-md)',
                        marginBottom: 'var(--space-lg)',
                        textAlign: 'center',
                        animation: 'slideDown 0.3s ease',
                    }}>
                        <div style={{ fontSize: '2rem', marginBottom: 'var(--space-sm)' }}>✓</div>
                        <div className="text-body" style={{ fontWeight: '600' }}>
                            سفر با موفقیت ایجاد شد!
                        </div>
                        <div className="text-body-sm">
                            به محض درخواست رزرو از مسافران، اطلاع‌رسانی خواهید شد.
                        </div>
                    </div>
                )}

                {/* Create Ride CTA */}
                <Link
                    href="/drive/create-ride"
                    className="card card-interactive mb-xl"
                    style={{
                        textDecoration: 'none',
                        background: 'linear-gradient(135deg, var(--cta-primary-soft) 0%, var(--ui-primary-soft) 100%)',
                        border: '2px solid var(--cta-primary)',
                    }}
                >
                    <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-md)' }}>
                        <div style={{
                            width: '60px',
                            height: '60px',
                            borderRadius: '50%',
                            backgroundColor: 'var(--cta-primary)',
                            color: '#FFFFFF',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontSize: '2rem',
                        }}>
                            ➕
                        </div>
                        <div style={{ flex: 1 }}>
                            <h3 className="text-h3 mb-xs">ایجاد سفر جدید</h3>
                            <p className="text-body-sm" style={{ color: 'var(--text-secondary)' }}>
                                مسیر و زمان سفر خود را مشخص کنید
                            </p>
                        </div>
                        <div style={{ fontSize: '1.5rem' }}>←</div>
                    </div>
                </Link>

                {/* Filters */}
                <div style={{
                    display: 'flex',
                    gap: 'var(--space-sm)',
                    marginBottom: 'var(--space-xl)',
                    overflowX: 'auto',
                    paddingBottom: 'var(--space-sm)',
                }}>
                    {[
                        { value: 'all', label: 'همه' },
                        { value: 'active', label: 'فعال' },
                        { value: 'completed', label: 'تکمیل شده' },
                        { value: 'cancelled', label: 'لغو شده' },
                    ].map((f) => (
                        <button
                            key={f.value}
                            onClick={() => setFilter(f.value)}
                            className={`btn btn-sm ${filter === f.value ? 'btn-primary' : 'btn-outline'}`}
                            style={{ whiteSpace: 'nowrap' }}
                        >
                            {f.label}
                        </button>
                    ))}
                </div>

                {/* Rides List */}
                {loading ? (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-md)' }}>
                        {[1, 2, 3].map((i) => (
                            <div key={i} className="skeleton skeleton-card" style={{ height: '180px' }}></div>
                        ))}
                    </div>
                ) : rides.length === 0 ? (
                    <div className="card" style={{ textAlign: 'center', padding: 'var(--space-2xl)' }}>
                        <div style={{ fontSize: '4rem', marginBottom: 'var(--space-md)' }}>🚗</div>
                        <h3 className="text-h3 mb-sm">سفری وجود ندارد</h3>
                        <p className="text-body" style={{ color: 'var(--text-secondary)', marginBottom: 'var(--space-lg)' }}>
                            هنوز سفری ایجاد نکرده‌اید
                        </p>
                        <Link href="/drive/create-ride" className="btn btn-primary">
                            ➕ ایجاد سفر جدید
                        </Link>
                    </div>
                ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-md)' }}>
                        {rides.map((ride) => (
                            <div key={ride.id} className="card">
                                <div style={{
                                    display: 'flex',
                                    justifyContent: 'space-between',
                                    alignItems: 'start',
                                    marginBottom: 'var(--space-md)',
                                }}>
                                    <div>
                                        <div style={{
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: 'var(--space-md)',
                                            marginBottom: 'var(--space-sm)',
                                        }}>
                                            <h3 className="text-h3">
                                                {ride.origin_city} → {ride.destination_city}
                                            </h3>
                                        </div>
                                        <div className="text-body-sm" style={{ color: 'var(--text-secondary)' }}>
                                            {formatJalaliDateTime(ride.departure_time)}
                                        </div>
                                    </div>

                                    {getStatusBadge(ride.status)}
                                </div>

                                <div style={{
                                    display: 'grid',
                                    gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))',
                                    gap: 'var(--space-md)',
                                    marginBottom: 'var(--space-md)',
                                    paddingTop: 'var(--space-md)',
                                    borderTop: '1px solid var(--border-default)',
                                }}>
                                    <div>
                                        <div className="text-caption">صندلی خالی</div>
                                        <div className="text-body" style={{ fontWeight: '600' }}>
                                            {toPersianNumber(ride.available_seats)} از {toPersianNumber(ride.total_seats)}
                                        </div>
                                    </div>

                                    <div>
                                        <div className="text-caption">قیمت</div>
                                        <div className="text-body" style={{ fontWeight: '600', color: 'var(--cta-primary)' }}>
                                            {formatPrice(ride.price_per_seat)}
                                        </div>
                                    </div>

                                    <div>
                                        <div className="text-caption">درخواست‌ها</div>
                                        <div className="text-body" style={{ fontWeight: '600' }}>
                                            {toPersianNumber(ride.booking_count)} رزرو
                                        </div>
                                    </div>
                                </div>

                                <div style={{
                                    display: 'flex',
                                    gap: 'var(--space-sm)',
                                    flexWrap: 'wrap',
                                }}>
                                    <Link
                                        href={`/ride/${ride.slug}`}
                                        className="btn btn-outline btn-sm"
                                    >
                                        مشاهده جزئیات
                                    </Link>

                                    {ride.booking_count > 0 && (
                                        <Link
                                            href={`/drive/ride/${ride.id}/bookings`}
                                            className="btn btn-primary btn-sm"
                                        >
                                            📋 مدیریت رزروها ({toPersianNumber(ride.booking_count)})
                                        </Link>
                                    )}

                                    {ride.status === 'ACTIVE' && (
                                        <>
                                            <Link
                                                href={`/drive/edit-ride/${ride.id}`}
                                                className="btn btn-outline btn-sm"
                                            >
                                                ✏️ ویرایش
                                            </Link>

                                            <button
                                                onClick={() => handleCancelRide(ride.id)}
                                                className="btn btn-ghost btn-sm"
                                                style={{ color: 'var(--error-text)' }}
                                            >
                                                ✗ لغو سفر
                                            </button>
                                        </>
                                    )}
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

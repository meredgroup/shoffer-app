'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { formatJalaliDateTime, formatPrice as formatPersianPrice, toPersianNumber } from '@/lib/jalali';

interface Booking {
    id: string;
    ride_id: string;
    seats_booked: number;
    total_price: number;
    status: 'REQUESTED' | 'CONFIRMED' | 'CANCELLED' | 'COMPLETED';
    payment_method: string;
    created_at: number;
    origin_city: string;
    destination_city: string;
    departure_time: number;
    other_party_name: string;
    other_party_avatar?: string;
}

export default function BookingsPage() {
    const [mounted, setMounted] = useState(false);
    const [bookings, setBookings] = useState<Booking[]>([]);
    const [loading, setLoading] = useState(true);
    const [tab, setTab] = useState<'passenger' | 'driver'>('passenger');
    const [filter, setFilter] = useState<string>('all');
    const router = useRouter();
    const searchParams = useSearchParams();

    useEffect(() => {
        setMounted(true);
        const newBookingId = searchParams.get('new');
        if (newBookingId) {
            // Show success message
            setTimeout(() => {
                window.history.replaceState({}, '', '/bookings');
            }, 3000);
        }
        loadBookings();
    }, [tab, filter]);

    const loadBookings = async () => {
        const token = localStorage.getItem('token');

        if (!token) {
            router.push('/auth/login');
            return;
        }

        setLoading(true);
        try {
            const params = new URLSearchParams();
            params.append('role', tab);
            if (filter !== 'all') {
                params.append('status', filter.toUpperCase());
            }

            const response = await fetch(
                `${process.env.NEXT_PUBLIC_API_URL}/bookings/my?${params.toString()}`,
                {
                    headers: {
                        'Authorization': `Bearer ${token}`,
                    },
                }
            );

            const data = await response.json();

            if (data.success) {
                setBookings(data.data || []);
            }
        } catch (err) {
            console.error('Failed to load bookings:', err);
        } finally {
            setLoading(false);
        }
    };



    const getStatusBadge = (status: string) => {
        const badges: Record<string, { class: string; text: string; icon: string }> = {
            REQUESTED: { class: 'badge-warning', text: 'در انتظار تأیید', icon: '⏳' },
            CONFIRMED: { class: 'badge-success', text: 'تأیید شده', icon: '✓' },
            CANCELLED: { class: 'badge-error', text: 'لغو شده', icon: '✗' },
            COMPLETED: { class: 'badge-primary', text: 'تکمیل شده', icon: '🎉' },
        };

        const badge = badges[status] || badges.REQUESTED;
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

    const newBookingId = searchParams.get('new');

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
                        رزروهای من
                    </h1>
                    <Link href="/dashboard" className="btn btn-ghost" style={{ color: '#FFFFFF' }}>
                        داشبورد
                    </Link>
                </div>
            </header>

            <div className="container" style={{ padding: 'var(--space-xl) var(--space-md)' }}>
                {/* Success Message */}
                {newBookingId && (
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
                            رزرو با موفقیت ثبت شد!
                        </div>
                        <div className="text-body-sm">
                            منتظر تأیید راننده باشید.
                        </div>
                    </div>
                )}

                {/* Tabs */}
                <div style={{
                    display: 'flex',
                    gap: 'var(--space-sm)',
                    marginBottom: 'var(--space-lg)',
                }}>
                    <button
                        onClick={() => setTab('passenger')}
                        className={`btn ${tab === 'passenger' ? 'btn-primary' : 'btn-ghost'}`}
                        style={{ flex: 1 }}
                    >
                        🧳 به عنوان مسافر
                    </button>
                    <button
                        onClick={() => setTab('driver')}
                        className={`btn ${tab === 'driver' ? 'btn-primary' : 'btn-ghost'}`}
                        style={{ flex: 1 }}
                    >
                        🚗 به عنوان راننده
                    </button>
                </div>

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
                        { value: 'requested', label: 'در انتظار' },
                        { value: 'confirmed', label: 'تأیید شده' },
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

                {/* Bookings List */}
                {loading ? (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-md)' }}>
                        {[1, 2, 3].map((i) => (
                            <div key={i} className="skeleton skeleton-card" style={{ height: '180px' }}></div>
                        ))}
                    </div>
                ) : bookings.length === 0 ? (
                    <div className="card" style={{ textAlign: 'center', padding: 'var(--space-2xl)' }}>
                        <div style={{ fontSize: '4rem', marginBottom: 'var(--space-md)' }}>🎫</div>
                        <h3 className="text-h3 mb-sm">رزروی یافت نشد</h3>
                        <p className="text-body" style={{ color: 'var(--text-secondary)', marginBottom: 'var(--space-lg)' }}>
                            {tab === 'passenger'
                                ? 'هنوز سفری رزرو نکرده‌اید'
                                : 'هنوز درخواست رزروی دریافت نکرده‌اید'}
                        </p>
                        <Link href="/search" className="btn btn-primary">
                            جستجوی سفر
                        </Link>
                    </div>
                ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-md)' }}>
                        {bookings.map((booking) => (
                            <div key={booking.id} className="card">
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
                                                {booking.origin_city} → {booking.destination_city}
                                            </h3>
                                        </div>
                                        <div className="text-body-sm" style={{ color: 'var(--text-secondary)' }}>
                                            {formatJalaliDateTime(booking.departure_time)}
                                        </div>
                                    </div>

                                    {getStatusBadge(booking.status)}
                                </div>

                                <div style={{
                                    display: 'grid',
                                    gridTemplateColumns: '1fr 1fr',
                                    gap: 'var(--space-md)',
                                    marginBottom: 'var(--space-md)',
                                    paddingTop: 'var(--space-md)',
                                    borderTop: '1px solid var(--border-default)',
                                }}>
                                    <div>
                                        <div className="text-caption">
                                            {tab === 'passenger' ? 'راننده' : 'مسافر'}
                                        </div>
                                        <div className="text-body" style={{ fontWeight: '600' }}>
                                            {booking.other_party_name}
                                        </div>
                                    </div>

                                    <div>
                                        <div className="text-caption">تعداد صندلی</div>
                                        <div className="text-body" style={{ fontWeight: '600' }}>
                                            {toPersianNumber(booking.seats_booked)} صندلی
                                        </div>
                                    </div>

                                    <div>
                                        <div className="text-caption">مبلغ پرداختی</div>
                                        <div className="text-body" style={{ fontWeight: '600', color: 'var(--cta-primary)' }}>
                                            {formatPersianPrice(booking.total_price)} تومان
                                        </div>
                                    </div>

                                    <div>
                                        <div className="text-caption">نحوه پرداخت</div>
                                        <div className="text-body" style={{ fontWeight: '600' }}>
                                            {booking.payment_method === 'CASH' ? '💵 نقدی' : '💳 آنلاین'}
                                        </div>
                                    </div>
                                </div>

                                <div style={{
                                    display: 'flex',
                                    gap: 'var(--space-sm)',
                                    flexWrap: 'wrap',
                                }}>
                                    <Link
                                        href={`/ride/${booking.ride_id}`}
                                        className="btn btn-outline btn-sm"
                                    >
                                        مشاهده سفر
                                    </Link>

                                    {tab === 'passenger' && booking.status === 'COMPLETED' && (
                                        <Link
                                            href={`/rate/${booking.id}`}
                                            className="btn btn-primary btn-sm"
                                        >
                                            ⭐ ثبت نظر
                                        </Link>
                                    )}

                                    {tab === 'driver' && booking.status === 'REQUESTED' && (
                                        <>
                                            <button className="btn btn-primary btn-sm">
                                                ✓ تأیید
                                            </button>
                                            <button className="btn btn-outline btn-sm" style={{
                                                color: 'var(--error-text)',
                                                borderColor: 'var(--error-text)',
                                            }}>
                                                ✗ رد
                                            </button>
                                        </>
                                    )}

                                    {booking.status === 'REQUESTED' && tab === 'passenger' && (
                                        <button className="btn btn-outline btn-sm" style={{
                                            color: 'var(--error-text)',
                                            borderColor: 'var(--error-text)',
                                        }}>
                                            لغو رزرو
                                        </button>
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
                <Link href="/bookings" className="bottom-nav-item active">
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

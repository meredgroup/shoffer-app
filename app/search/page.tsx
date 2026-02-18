'use client';

export const dynamic = 'force-dynamic';

import { useState, useEffect, Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { formatJalaliDateTime, formatPrice as formatPersianPrice, toPersianNumber } from '@/lib/jalali';

interface Ride {
    id: string;
    slug: string;
    origin_city: string;
    origin_address: string;
    destination_city: string;
    destination_address: string;
    departure_time: number;
    price_per_seat: number;
    available_seats: number;
    total_seats: number;
    women_only: boolean;
    pets_allowed: boolean;
    driver_name: string;
    driver_avatar?: string;
    driver_rating: number;
    make: string;
    model: string;
    color: string;
}

function SearchContent() {
    const searchParams = useSearchParams();
    const [mounted, setMounted] = useState(false);
    const [rides, setRides] = useState<Ride[]>([]);
    const [loading, setLoading] = useState(true);
    const [filters, setFilters] = useState({
        from: searchParams.get('from') || '',
        to: searchParams.get('to') || '',
        date: searchParams.get('date') || '',
        minSeats: '',
        maxPrice: '',
        womenOnly: false,
    });

    useEffect(() => {
        setMounted(true);
        searchRides();
    }, []);

    const searchRides = async () => {
        setLoading(true);
        try {
            const params = new URLSearchParams();
            if (filters.from) params.append('origin_city', filters.from);
            if (filters.to) params.append('destination_city', filters.to);
            if (filters.date) params.append('date', filters.date);
            if (filters.minSeats) params.append('min_seats', filters.minSeats);
            if (filters.maxPrice) params.append('max_price', filters.maxPrice);
            if (filters.womenOnly) params.append('women_only', 'true');

            const response = await fetch(
                `${process.env.NEXT_PUBLIC_API_URL}/rides/search?${params.toString()}`
            );
            const data = await response.json();

            if (data.success) {
                setRides(data.data || []);
            }
        } catch (error) {
            console.error('Search error:', error);
        } finally {
            setLoading(false);
        }
    };



    if (!mounted) {
        return (
            <div className="container" style={{ padding: 'var(--space-xl) var(--space-md)' }}>
                <div className="skeleton skeleton-card" style={{ height: '600px' }}></div>
            </div>
        );
    }

    return (
        <div style={{ minHeight: '100vh', backgroundColor: 'var(--bg-main)' }}>
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
                    <Link href="/" style={{ textDecoration: 'none' }}>
                        <h1 className="text-h2" style={{ color: '#FFFFFF', fontWeight: '700' }}>
                            شوفر
                        </h1>
                    </Link>
                    <Link href="/dashboard" className="btn btn-ghost" style={{ color: '#FFFFFF' }}>
                        داشبورد
                    </Link>
                </div>
            </header>

            <div className="container" style={{
                padding: 'var(--space-xl) var(--space-md)',
                paddingBottom: '100px',
            }}>
                {/* Search Form */}
                <div className="card" style={{ marginBottom: 'var(--space-xl)' }}>
                    <h2 className="text-h3 mb-lg">جستجوی سفر</h2>

                    <div style={{
                        display: 'grid',
                        gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
                        gap: 'var(--space-md)',
                    }}>
                        <div>
                            <label className="text-body-sm" style={{
                                display: 'block',
                                marginBottom: 'var(--space-xs)',
                                fontWeight: '500',
                            }}>
                                مبدا
                            </label>
                            <input
                                type="text"
                                className="input"
                                value={filters.from}
                                onChange={(e) => setFilters({ ...filters, from: e.target.value })}
                                placeholder="تهران"
                            />
                        </div>

                        <div>
                            <label className="text-body-sm" style={{
                                display: 'block',
                                marginBottom: 'var(--space-xs)',
                                fontWeight: '500',
                            }}>
                                مقصد
                            </label>
                            <input
                                type="text"
                                className="input"
                                value={filters.to}
                                onChange={(e) => setFilters({ ...filters, to: e.target.value })}
                                placeholder="اصفهان"
                            />
                        </div>

                        <div>
                            <label className="text-body-sm" style={{
                                display: 'block',
                                marginBottom: 'var(--space-xs)',
                                fontWeight: '500',
                            }}>
                                تاریخ
                            </label>
                            <input
                                type="date"
                                className="input"
                                value={filters.date}
                                onChange={(e) => setFilters({ ...filters, date: e.target.value })}
                            />
                        </div>

                        <div>
                            <label className="text-body-sm" style={{
                                display: 'block',
                                marginBottom: 'var(--space-xs)',
                                fontWeight: '500',
                            }}>
                                حداقل صندلی
                            </label>
                            <input
                                type="number"
                                className="input"
                                value={filters.minSeats}
                                onChange={(e) => setFilters({ ...filters, minSeats: e.target.value })}
                                placeholder="1"
                                min="1"
                            />
                        </div>

                        <div>
                            <label className="text-body-sm" style={{
                                display: 'block',
                                marginBottom: 'var(--space-xs)',
                                fontWeight: '500',
                            }}>
                                حداکثر قیمت (تومان)
                            </label>
                            <input
                                type="number"
                                className="input"
                                value={filters.maxPrice}
                                onChange={(e) => setFilters({ ...filters, maxPrice: e.target.value })}
                                placeholder="1,000,000"
                            />
                        </div>

                        <div style={{ display: 'flex', alignItems: 'end' }}>
                            <label style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: 'var(--space-sm)',
                                cursor: 'pointer',
                                padding: '12px 0',
                                userSelect: 'none',
                            }}>
                                <input
                                    type="checkbox"
                                    checked={filters.womenOnly}
                                    onChange={(e) => setFilters({ ...filters, womenOnly: e.target.checked })}
                                />
                                <span className="text-body-sm">فقط سفرهای ویژه بانوان</span>
                            </label>
                        </div>
                    </div>

                    <button
                        onClick={searchRides}
                        className="btn btn-primary btn-lg w-full"
                        style={{ marginTop: 'var(--space-lg)' }}
                        disabled={loading}
                    >
                        {loading ? 'در حال جستجو...' : '🔍 جستجو'}
                    </button>
                </div>

                {/* Results */}
                <div>
                    <div style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        marginBottom: 'var(--space-lg)',
                    }}>
                        <h2 className="text-h2">
                            {loading ? 'در حال جستجو...' : `${toPersianNumber(rides.length)} سفر یافت شد`}
                        </h2>
                    </div>

                    {loading ? (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-md)' }}>
                            {[1, 2, 3].map((i) => (
                                <div key={i} className="skeleton skeleton-card" style={{ height: '200px' }}></div>
                            ))}
                        </div>
                    ) : rides.length === 0 ? (
                        <div className="card" style={{ textAlign: 'center', padding: 'var(--space-2xl)' }}>
                            <div style={{ fontSize: '4rem', marginBottom: 'var(--space-md)' }}>🔍</div>
                            <h3 className="text-h3 mb-sm">سفری یافت نشد</h3>
                            <p className="text-body mb-lg" style={{ color: 'var(--text-secondary)' }}>
                                متأسفانه سفری با این مشخصات پیدا نکردیم. لطفاً فیلترها را تغییر دهید یا درخواست سفر خود را ثبت کنید.
                            </p>
                            <Link href="/trip-requests/create" className="btn btn-primary">
                                🚀 ثبت درخواست سفر جدید
                            </Link>
                        </div>
                    ) : (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-md)' }}>
                            {rides.map((ride) => (
                                <Link
                                    key={ride.id}
                                    href={`/ride/${ride.slug}`}
                                    className="card card-interactive"
                                    style={{ textDecoration: 'none', color: 'inherit' }}
                                >
                                    <div style={{
                                        display: 'grid',
                                        gridTemplateColumns: '1fr auto',
                                        gap: 'var(--space-lg)',
                                    }}>
                                        {/* Left: Ride Info */}
                                        <div>
                                            {/* Route */}
                                            <div style={{
                                                display: 'flex',
                                                alignItems: 'center',
                                                gap: 'var(--space-md)',
                                                marginBottom: 'var(--space-md)',
                                            }}>
                                                <div>
                                                    <div className="text-h3">{ride.origin_city}</div>
                                                    <div className="text-caption">{ride.origin_address}</div>
                                                </div>
                                                <div style={{
                                                    color: 'var(--ui-primary)',
                                                    fontSize: '1.5rem',
                                                    fontWeight: '700',
                                                }}>
                                                    →
                                                </div>
                                                <div>
                                                    <div className="text-h3">{ride.destination_city}</div>
                                                    <div className="text-caption">{ride.destination_address}</div>
                                                </div>
                                            </div>

                                            {/* Time & Vehicle */}
                                            <div style={{
                                                display: 'flex',
                                                flexWrap: 'wrap',
                                                gap: 'var(--space-lg)',
                                                marginBottom: 'var(--space-md)',
                                            }}>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-xs)' }}>
                                                    <span>🕐</span>
                                                    <span className="text-body-sm">{formatJalaliDateTime(ride.departure_time)}</span>
                                                </div>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-xs)' }}>
                                                    <span>🚗</span>
                                                    <span className="text-body-sm">
                                                        {ride.make} {ride.model} {ride.color}
                                                    </span>
                                                </div>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-xs)' }}>
                                                    <span>💺</span>
                                                    <span className="text-body-sm">
                                                        {toPersianNumber(ride.available_seats)} صندلی خالی از {toPersianNumber(ride.total_seats)}
                                                    </span>
                                                </div>
                                            </div>

                                            {/* Driver */}
                                            <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-sm)' }}>
                                                <div style={{
                                                    width: '40px',
                                                    height: '40px',
                                                    borderRadius: '50%',
                                                    backgroundColor: 'var(--bg-muted)',
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    justifyContent: 'center',
                                                    fontSize: '1.25rem',
                                                }}>
                                                    👤
                                                </div>
                                                <div>
                                                    <div className="text-body-sm" style={{ fontWeight: '600' }}>
                                                        {ride.driver_name}
                                                    </div>
                                                    <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-xs)' }}>
                                                        <span style={{ color: 'var(--star-filled)' }}>⭐</span>
                                                        <span className="text-caption">
                                                            {ride.driver_rating.toFixed(1)}
                                                        </span>
                                                    </div>
                                                </div>

                                                {/* Badges */}
                                                {ride.women_only && (
                                                    <span className="badge badge-primary" style={{ marginRight: 'auto' }}>
                                                        ویژه بانوان
                                                    </span>
                                                )}
                                                {ride.pets_allowed && (
                                                    <span className="badge badge-success">
                                                        حیوانات خانگی مجاز
                                                    </span>
                                                )}
                                            </div>
                                        </div>

                                        {/* Right: Price & CTA */}
                                        <div style={{
                                            display: 'flex',
                                            flexDirection: 'column',
                                            alignItems: 'end',
                                            justifyContent: 'space-between',
                                            minWidth: '150px',
                                        }}>
                                            <div style={{ textAlign: 'left' }}>
                                                <div className="text-caption">قیمت هر صندلی</div>
                                                <div className="text-h2" style={{ color: 'var(--cta-primary)' }}>
                                                    {formatPersianPrice(ride.price_per_seat)}
                                                </div>
                                                <div className="text-caption">تومان</div>
                                            </div>

                                            <button className="btn btn-cta" style={{ width: '100%' }}>
                                                مشاهده و رزرو
                                            </button>
                                        </div>
                                    </div>
                                </Link>
                            ))}
                        </div>
                    )}
                </div>
            </div>

            {/* Bottom Navigation */}
            <nav className="bottom-nav">
                <Link href="/" className="bottom-nav-item">
                    <span className="bottom-nav-icon">🏠</span>
                    <span>خانه</span>
                </Link>
                <Link href="/search" className="bottom-nav-item active">
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

export default function SearchPage() {
    return (
        <Suspense fallback={
            <div className="container" style={{ padding: 'var(--space-xl) var(--space-md)' }}>
                <div className="skeleton skeleton-card" style={{ height: '600px' }}></div>
            </div>
        }>
            <SearchContent />
        </Suspense>
    );
}

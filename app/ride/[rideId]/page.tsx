'use client';

import { useState, useEffect, use } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { formatJalaliDateTime, formatPrice as formatPersianPrice, toPersianNumber } from '@/lib/jalali';

interface Ride {
    id: string;
    slug: string;
    driver_id: string;
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
    smoking_allowed: boolean;
    notes?: string;
    driver_name: string;
    driver_avatar?: string;
    driver_rating: number;
    driver_total_ratings: number;
    make: string;
    model: string;
    color: string;
    year: number;
    license_plate: string;
}

export const runtime = 'edge';

export default function RideDetailPage({ params }: { params: Promise<{ rideId: string }> }) {
    const { rideId } = use(params);
    const [mounted, setMounted] = useState(false);
    const [ride, setRide] = useState<Ride | null>(null);
    const [loading, setLoading] = useState(true);
    const [bookingSeats, setBookingSeats] = useState(1);
    const [bookingLoading, setBookingLoading] = useState(false);
    const [error, setError] = useState('');
    const router = useRouter();

    useEffect(() => {
        setMounted(true);
        loadRide();
    }, [rideId]);

    const loadRide = async () => {
        try {
            const response = await fetch(
                `${process.env.NEXT_PUBLIC_API_URL}/rides/${rideId}`
            );
            const data = await response.json();

            if (data.success) {
                setRide(data.data);
            } else {
                setError('سفر یافت نشد');
            }
        } catch (err) {
            setError('خطا در دریافت اطلاعات');
        } finally {
            setLoading(false);
        }
    };

    const handleBooking = async () => {
        const token = localStorage.getItem('token');

        if (!token) {
            router.push(`/auth/login?redirect=/ride/${rideId}`);
            return;
        }

        setBookingLoading(true);
        setError('');

        try {
            const response = await fetch(
                `${process.env.NEXT_PUBLIC_API_URL}/bookings`,
                {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${token}`,
                    },
                    body: JSON.stringify({
                        ride_id: ride!.id,
                        seats_booked: bookingSeats,
                        payment_method: 'CASH',
                    }),
                }
            );

            const data = await response.json();

            if (data.success) {
                // Success! Redirect to bookings
                router.push(`/bookings?new=${data.data.booking_id}`);
            } else {
                setError(data.error || 'خطا در رزرو');
            }
        } catch (err) {
            setError('خطا در ارتباط با سرور');
        } finally {
            setBookingLoading(false);
        }
    };



    if (!mounted || loading) {
        return (
            <div className="container" style={{ padding: 'var(--space-xl)' }}>
                <div className="skeleton skeleton-card" style={{ height: '600px' }}></div>
            </div>
        );
    }

    if (error && !ride) {
        return (
            <div className="container" style={{
                padding: 'var(--space-2xl)',
                textAlign: 'center',
                minHeight: '100vh',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
            }}>
                <div>
                    <div style={{ fontSize: '4rem', marginBottom: 'var(--space-lg)' }}>😕</div>
                    <h2 className="text-h2 mb-md">{error}</h2>
                    <Link href="/search" className="btn btn-primary">
                        بازگشت به جستجو
                    </Link>
                </div>
            </div>
        );
    }

    if (!ride) return null;

    const totalPrice = ride.price_per_seat * bookingSeats;

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
                <div className="container flex items-center gap-md">
                    <Link href="/search" style={{
                        color: '#FFFFFF',
                        fontSize: '1.5rem',
                        textDecoration: 'none',
                    }}>
                        ←
                    </Link>
                    <h1 className="text-h2" style={{ color: '#FFFFFF', fontWeight: '700' }}>
                        جزئیات سفر
                    </h1>
                </div>
            </header>

            <div className="container" style={{ padding: 'var(--space-xl) var(--space-md)' }}>
                {/* Route Card */}
                <div className="card mb-lg">
                    <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        marginBottom: 'var(--space-lg)',
                    }}>
                        <div style={{ flex: 1 }}>
                            <div className="text-caption" style={{ marginBottom: 'var(--space-xs)' }}>
                                مبدا
                            </div>
                            <div className="text-h2" style={{ marginBottom: 'var(--space-xs)' }}>
                                {ride.origin_city}
                            </div>
                            <div className="text-body-sm" style={{ color: 'var(--text-secondary)' }}>
                                {ride.origin_address}
                            </div>
                        </div>

                        <div style={{
                            fontSize: '2rem',
                            color: 'var(--ui-primary)',
                            padding: '0 var(--space-lg)',
                        }}>
                            →
                        </div>

                        <div style={{ flex: 1, textAlign: 'left' }}>
                            <div className="text-caption" style={{ marginBottom: 'var(--space-xs)' }}>
                                مقصد
                            </div>
                            <div className="text-h2" style={{ marginBottom: 'var(--space-xs)' }}>
                                {ride.destination_city}
                            </div>
                            <div className="text-body-sm" style={{ color: 'var(--text-secondary)' }}>
                                {ride.destination_address}
                            </div>
                        </div>
                    </div>

                    <div style={{
                        padding: 'var(--space-md)',
                        backgroundColor: 'var(--bg-muted)',
                        borderRadius: 'var(--radius-md)',
                        display: 'flex',
                        alignItems: 'center',
                        gap: 'var(--space-sm)',
                    }}>
                        <span>🕐</span>
                        <span className="text-body" style={{ fontWeight: '600' }}>
                            {formatJalaliDateTime(ride.departure_time)}
                        </span>
                    </div>
                </div>

                {/* Driver Card */}
                <div className="card mb-lg">
                    <h3 className="text-h3 mb-md">راننده</h3>

                    <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-md)' }}>
                        <div style={{
                            width: '80px',
                            height: '80px',
                            borderRadius: '50%',
                            backgroundColor: 'var(--bg-muted)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontSize: '2.5rem',
                        }}>
                            👤
                        </div>

                        <div style={{ flex: 1 }}>
                            <div className="text-h3" style={{ marginBottom: 'var(--space-xs)' }}>
                                {ride.driver_name}
                            </div>

                            <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-md)' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-xs)' }}>
                                    <span style={{ color: 'var(--star-filled)' }}>⭐</span>
                                    <span className="text-body">
                                        {ride.driver_rating.toFixed(1)}
                                    </span>
                                    <span className="text-caption">
                                        ({toPersianNumber(ride.driver_total_ratings)} نظر)
                                    </span>
                                </div>
                            </div>
                        </div>

                        <Link
                            href={`/driver/${ride.driver_id}`}
                            className="btn btn-outline btn-sm"
                        >
                            پروفایل
                        </Link>
                    </div>
                </div>

                {/* Vehicle Card */}
                <div className="card mb-lg">
                    <h3 className="text-h3 mb-md">خودرو</h3>

                    <div style={{
                        display: 'grid',
                        gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                        gap: 'var(--space-md)',
                    }}>
                        <div>
                            <div className="text-caption">خودرو</div>
                            <div className="text-body" style={{ fontWeight: '600' }}>
                                {ride.make} {ride.model}
                            </div>
                        </div>

                        <div>
                            <div className="text-caption">رنگ</div>
                            <div className="text-body" style={{ fontWeight: '600' }}>
                                {ride.color}
                            </div>
                        </div>

                        <div>
                            <div className="text-caption">سال ساخت</div>
                            <div className="text-body" style={{ fontWeight: '600' }}>
                                {toPersianNumber(ride.year)}
                            </div>
                        </div>

                        <div>
                            <div className="text-caption">پلاک</div>
                            <div className="text-body" style={{ fontWeight: '600' }}>
                                {ride.license_plate}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Features Card */}
                <div className="card mb-lg">
                    <h3 className="text-h3 mb-md">امکانات و قوانین</h3>

                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 'var(--space-sm)' }}>
                        <span className="badge badge-primary">
                            💺 {toPersianNumber(ride.available_seats)} صندلی از {toPersianNumber(ride.total_seats)}
                        </span>
                        {ride.women_only && (
                            <span className="badge badge-primary">ویژه بانوان</span>
                        )}
                        {ride.pets_allowed && (
                            <span className="badge badge-success">حیوانات خانگی مجاز</span>
                        )}
                        {ride.smoking_allowed && (
                            <span className="badge badge-warning">سیگار مجاز</span>
                        )}
                    </div>

                    {ride.notes && (
                        <div style={{
                            marginTop: 'var(--space-md)',
                            padding: 'var(--space-md)',
                            backgroundColor: 'var(--bg-muted)',
                            borderRadius: 'var(--radius-md)',
                        }}>
                            <div className="text-caption" style={{ marginBottom: 'var(--space-xs)' }}>
                                توضیحات راننده:
                            </div>
                            <div className="text-body">{ride.notes}</div>
                        </div>
                    )}
                </div>

                {/* Booking Card */}
                {ride.available_seats > 0 ? (
                    <div className="card" style={{
                        border: '2px solid var(--cta-primary)',
                        position: 'sticky',
                        bottom: 'calc(60px + var(--space-md))',
                    }}>
                        <h3 className="text-h3 mb-md">رزرو صندلی</h3>

                        {error && (
                            <div style={{
                                padding: 'var(--space-md)',
                                backgroundColor: 'var(--error-bg)',
                                color: 'var(--error-text)',
                                borderRadius: 'var(--radius-md)',
                                marginBottom: 'var(--space-md)',
                            }}>
                                {error}
                            </div>
                        )}

                        <div style={{ marginBottom: 'var(--space-lg)' }}>
                            <label className="text-body-sm" style={{
                                display: 'block',
                                marginBottom: 'var(--space-sm)',
                                fontWeight: '600',
                            }}>
                                تعداد صندلی (حداکثر {toPersianNumber(ride.available_seats)})
                            </label>

                            <div style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: 'var(--space-md)',
                            }}>
                                <button
                                    onClick={() => setBookingSeats(Math.max(1, bookingSeats - 1))}
                                    className="btn btn-outline"
                                    style={{ width: '50px', height: '50px', fontSize: '1.5rem' }}
                                    disabled={bookingSeats <= 1}
                                >
                                    −
                                </button>

                                <div style={{
                                    flex: 1,
                                    textAlign: 'center',
                                    fontSize: '2rem',
                                    fontWeight: '700',
                                    color: 'var(--ui-primary)',
                                }}>
                                    {toPersianNumber(bookingSeats)}
                                </div>

                                <button
                                    onClick={() => setBookingSeats(Math.min(ride.available_seats, bookingSeats + 1))}
                                    className="btn btn-outline"
                                    style={{ width: '50px', height: '50px', fontSize: '1.5rem' }}
                                    disabled={bookingSeats >= ride.available_seats}
                                >
                                    +
                                </button>
                            </div>
                        </div>

                        <div style={{
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            marginBottom: 'var(--space-lg)',
                            padding: 'var(--space-md)',
                            backgroundColor: 'var(--cta-primary-soft)',
                            borderRadius: 'var(--radius-md)',
                        }}>
                            <div>
                                <div className="text-caption">مجموع هزینه</div>
                                <div className="text-h2" style={{ color: 'var(--cta-primary)' }}>
                                    {formatPersianPrice(totalPrice)} تومان
                                </div>
                            </div>

                            <div className="text-body-sm" style={{ textAlign: 'left' }}>
                                {formatPersianPrice(ride.price_per_seat)} × {toPersianNumber(bookingSeats)}
                            </div>
                        </div>

                        <button
                            onClick={handleBooking}
                            className="btn btn-cta btn-lg w-full"
                            disabled={bookingLoading || ride.available_seats === 0}
                        >
                            {bookingLoading ? 'در حال رزرو...' : '✓ تأیید و رزرو'}
                        </button>

                        <p className="text-caption" style={{
                            marginTop: 'var(--space-sm)',
                            textAlign: 'center',
                        }}>
                            پرداخت هزینه به صورت نقدی در ابتدای سفر
                        </p>
                    </div>
                ) : (
                    <div className="card" style={{
                        backgroundColor: 'var(--error-bg)',
                        textAlign: 'center',
                    }}>
                        <div style={{ fontSize: '3rem', marginBottom: 'var(--space-md)' }}>🚫</div>
                        <h3 className="text-h3" style={{ color: 'var(--error-text)' }}>
                            صندلی خالی موجود نیست
                        </h3>
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

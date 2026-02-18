'use client';

import { useState, useEffect, use } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { toPersianNumber } from '@/lib/jalali';

export default function RateBookingPage({ params }: { params: Promise<{ bookingId: string }> }) {
    const { bookingId } = use(params);
    const [mounted, setMounted] = useState(false);
    const [loading, setLoading] = useState(false);
    const [booking, setBooking] = useState<any>(null);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState(false);
    const [rating, setRating] = useState(0);
    const [hover, setHover] = useState(0);
    const [review, setReview] = useState('');
    const router = useRouter();

    useEffect(() => {
        setMounted(true);
        loadBooking();
    }, []);

    const loadBooking = async () => {
        const token = localStorage.getItem('token');
        if (!token) {
            router.push('/auth/login');
            return;
        }

        try {
            // We'll just fetch all bookings and filter for now, 
            // or we could add a specialized endpoint if needed.
            const response = await fetch(
                `${process.env.NEXT_PUBLIC_API_URL}/bookings/my`,
                {
                    headers: { 'Authorization': `Bearer ${token}` }
                }
            );
            const data = await response.json();
            if (data.success) {
                const found = data.data.find((b: any) => b.id === bookingId);
                if (found) {
                    setBooking(found);
                } else {
                    setError('رزرو یافت نشد');
                }
            }
        } catch (err) {
            setError('خطا در دریافت اطلاعات');
        }
    };

    const handleSubmit = async () => {
        if (rating === 0) {
            setError('لطفاً امتیاز خود را وارد کنید');
            return;
        }

        const token = localStorage.getItem('token');
        setLoading(true);
        setError('');

        try {
            const response = await fetch(
                `${process.env.NEXT_PUBLIC_API_URL}/bookings/${bookingId}/rate`,
                {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${token}`,
                    },
                    body: JSON.stringify({
                        stars: rating,
                        review_text: review,
                    }),
                }
            );

            const data = await response.json();

            if (data.success) {
                setSuccess(true);
                setTimeout(() => {
                    router.push('/bookings');
                }, 3000);
            } else {
                setError(data.error || 'خطا در ثبت امتیاز');
            }
        } catch (err) {
            setError('خطا در ارتباط با سرور');
        } finally {
            setLoading(false);
        }
    };

    if (!mounted) return null;

    if (success) {
        return (
            <div style={{ minHeight: '100vh', backgroundColor: 'var(--bg-main)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 'var(--space-md)' }}>
                <div className="card" style={{ maxWidth: '400px', width: '100%', textAlign: 'center', padding: 'var(--space-2xl)' }}>
                    <div style={{ fontSize: '4rem', marginBottom: 'var(--space-md)' }}>🌟</div>
                    <h2 className="text-h2 mb-md">ممنون از امتیاز شما!</h2>
                    <p className="text-body mb-lg" style={{ color: 'var(--text-secondary)' }}>
                        امتیاز شما با موفقیت ثبت شد و به بهبود کیفیت خدمات ما کمک می‌کند.
                    </p>
                    <Link href="/bookings" className="btn btn-primary w-full">
                        بازگشت به رزروها
                    </Link>
                </div>
            </div>
        );
    }

    return (
        <div style={{ minHeight: '100vh', backgroundColor: 'var(--bg-main)', paddingBottom: '100px' }}>
            <header style={{
                backgroundColor: 'var(--brand-anchor)',
                padding: 'var(--space-md)',
                boxShadow: 'var(--shadow-md)',
            }}>
                <div className="container flex items-center gap-md">
                    <Link href="/bookings" style={{ color: '#FFFFFF', textDecoration: 'none', fontSize: '1.5rem' }}>←</Link>
                    <h1 className="text-h2" style={{ color: '#FFFFFF' }}>ثبت امتیاز سفر</h1>
                </div>
            </header>

            <div className="container" style={{ padding: 'var(--space-xl) var(--space-md)', maxWidth: '500px' }}>
                {booking ? (
                    <div className="card">
                        <div style={{ textAlign: 'center', marginBottom: 'var(--space-xl)' }}>
                            <div style={{
                                width: '80px',
                                height: '80px',
                                borderRadius: '50%',
                                backgroundColor: 'var(--bg-muted)',
                                margin: '0 auto var(--space-md)',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                fontSize: '2.5rem'
                            }}>
                                👤
                            </div>
                            <h2 className="text-h2 mb-xs">{booking.other_party_name}</h2>
                            <p className="text-body-sm" style={{ color: 'var(--text-secondary)' }}>
                                سفر {booking.origin_city} به {booking.destination_city}
                            </p>
                        </div>

                        <div style={{ marginBottom: 'var(--space-xl)' }}>
                            <h3 className="text-h3 mb-lg" style={{ textAlign: 'center' }}>تجربه شما از این سفر چگونه بود؟</h3>

                            <div style={{
                                display: 'flex',
                                justifyContent: 'center',
                                gap: 'var(--space-sm)',
                                fontSize: '2.5rem',
                                marginBottom: 'var(--space-md)'
                            }}>
                                {[1, 2, 3, 4, 5].map((star) => (
                                    <button
                                        key={star}
                                        type="button"
                                        onClick={() => setRating(star)}
                                        onMouseEnter={() => setHover(star)}
                                        onMouseLeave={() => setHover(0)}
                                        style={{
                                            background: 'none',
                                            border: 'none',
                                            cursor: 'pointer',
                                            color: (hover || rating) >= star ? 'var(--star-filled)' : 'var(--border-default)',
                                            transition: 'transform 0.1s',
                                            padding: '0 4px'
                                        }}
                                        className={(hover || rating) >= star ? 'animate-bounce' : ''}
                                    >
                                        ★
                                    </button>
                                ))}
                            </div>
                            <p style={{ textAlign: 'center', color: 'var(--text-secondary)', minHeight: '1.5em' }}>
                                {rating === 1 && 'اصلاً خوب نبود'}
                                {rating === 2 && 'می‌توانست بهتر باشد'}
                                {rating === 3 && 'خوب بود'}
                                {rating === 4 && 'بسیار خوب بود'}
                                {rating === 5 && 'عالی و بی‌نقص بود!'}
                            </p>
                        </div>

                        <div style={{ marginBottom: 'var(--space-xl)' }}>
                            <label className="text-body-sm mb-xs" style={{ display: 'block' }}>توضیحات شما (اختیاری)</label>
                            <textarea
                                className="input"
                                value={review}
                                onChange={(e) => setReview(e.target.value)}
                                placeholder="درباره راننده، خودرو و کیفیت سفر بنویسید..."
                                rows={4}
                                style={{ resize: 'none' }}
                            />
                        </div>

                        {error && (
                            <div style={{
                                padding: 'var(--space-md)',
                                backgroundColor: 'var(--error-bg)',
                                color: 'var(--error-text)',
                                borderRadius: 'var(--radius-md)',
                                marginBottom: 'var(--space-md)',
                                textAlign: 'center'
                            }}>
                                {error}
                            </div>
                        )}

                        <button
                            onClick={handleSubmit}
                            className="btn btn-primary btn-lg w-full"
                            disabled={loading || rating === 0}
                        >
                            {loading ? 'در حال ثبت...' : 'ثبت امتیاز'}
                        </button>
                    </div>
                ) : error ? (
                    <div className="card" style={{ textAlign: 'center' }}>
                        <p className="text-error mb-lg">{error}</p>
                        <Link href="/bookings" className="btn btn-outline">بازگشت</Link>
                    </div>
                ) : (
                    <div className="skeleton skeleton-card" style={{ height: '400px' }}></div>
                )}
            </div>
        </div>
    );
}

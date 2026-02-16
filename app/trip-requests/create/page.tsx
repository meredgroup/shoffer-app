'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { getJalaliInputDate, toPersianNumber } from '@/lib/jalali';

export default function CreateTripRequestPage() {
    const [mounted, setMounted] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState(false);
    const router = useRouter();

    const [formData, setFormData] = useState({
        origin_city: '',
        origin_address: '',
        destination_city: '',
        destination_address: '',
        requested_departure_start: '',
        seats_needed: '1',
        max_price_per_seat: '',
        notes: '',
        notify_favorites: true,
    });

    useEffect(() => {
        setMounted(true);
        const token = localStorage.getItem('token');
        if (!token) {
            router.push('/auth/login?redirect=/trip-requests/create');
        }
    }, [router]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        const token = localStorage.getItem('token');
        if (!token) return;

        setLoading(true);
        setError('');

        try {
            // Convert date to timestamp (start of day)
            const departureDate = new Date(formData.requested_departure_start);
            const requested_departure_start = Math.floor(departureDate.getTime() / 1000);

            const response = await fetch(
                `${process.env.NEXT_PUBLIC_API_URL}/users/trip-requests`,
                {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${token}`,
                    },
                    body: JSON.stringify({
                        ...formData,
                        requested_departure_start,
                        seats_needed: parseInt(formData.seats_needed),
                        max_price_per_seat: formData.max_price_per_seat ? parseInt(formData.max_price_per_seat) : null,
                    }),
                }
            );

            const data = await response.json();

            if (data.success) {
                setSuccess(true);
                setTimeout(() => {
                    router.push('/dashboard');
                }, 3000);
            } else {
                setError(data.error || 'خطا در ثبت درخواست');
            }
        } catch (err) {
            setError('خطا در ارتباط با سرور');
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

    if (success) {
        return (
            <div style={{ minHeight: '100vh', backgroundColor: 'var(--bg-main)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 'var(--space-md)' }}>
                <div className="card" style={{ maxWidth: '500px', width: '100%', textAlign: 'center', padding: 'var(--space-2xl)' }}>
                    <div style={{ fontSize: '5rem', marginBottom: 'var(--space-lg)' }}>✅</div>
                    <h2 className="text-h2 mb-md">درخواست با موفقیت ثبت شد</h2>
                    <p className="text-body mb-xl" style={{ color: 'var(--text-secondary)' }}>
                        درخواست شما برای رانندگان مرتبط و علاقه‌مندی‌های شما ارسال شد. در صورت پیدا شدن سفر، به شما اطلاع می‌دهیم.
                    </p>
                    <Link href="/dashboard" className="btn btn-primary w-full">
                        بازگشت به داشبورد
                    </Link>
                </div>
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
                <div className="container flex items-center gap-md">
                    <Link href="/search" style={{
                        color: '#FFFFFF',
                        fontSize: '1.5rem',
                        textDecoration: 'none',
                    }}>
                        ←
                    </Link>
                    <h1 className="text-h2" style={{ color: '#FFFFFF', fontWeight: '700' }}>
                        ثبت درخواست سفر
                    </h1>
                </div>
            </header>

            <div className="container" style={{ padding: 'var(--space-xl) var(--space-md)', maxWidth: '600px' }}>
                <div className="card">
                    <p className="text-body mb-lg" style={{ color: 'var(--text-secondary)' }}>
                        اگر سفر مورد نظر خود را پیدا نکردید، درخواست خود را ثبت کنید تا رانندگان با شما تماس بگیرند.
                    </p>

                    {error && (
                        <div style={{
                            padding: 'var(--space-md)',
                            backgroundColor: 'var(--error-bg)',
                            color: 'var(--error-text)',
                            borderRadius: 'var(--radius-md)',
                            marginBottom: 'var(--space-lg)',
                            textAlign: 'center',
                        }}>
                            {error}
                        </div>
                    )}

                    <form onSubmit={handleSubmit}>
                        {/* Route Section */}
                        <div style={{ marginBottom: 'var(--space-xl)' }}>
                            <h3 className="text-h3 mb-md" style={{ color: 'var(--ui-primary)' }}>📍 مسیر سفر</h3>

                            <div style={{ marginBottom: 'var(--space-md)' }}>
                                <label className="text-body-sm mb-xs" style={{ display: 'block', fontWeight: '500' }}>شهر مبدا</label>
                                <input
                                    type="text"
                                    className="input"
                                    value={formData.origin_city}
                                    onChange={(e) => setFormData({ ...formData, origin_city: e.target.value })}
                                    placeholder="مثلاً: تهران"
                                    required
                                />
                            </div>

                            <div style={{ marginBottom: 'var(--space-md)' }}>
                                <label className="text-body-sm mb-xs" style={{ display: 'block', fontWeight: '500' }}>شهر مقصد</label>
                                <input
                                    type="text"
                                    className="input"
                                    value={formData.destination_city}
                                    onChange={(e) => setFormData({ ...formData, destination_city: e.target.value })}
                                    placeholder="مثلاً: اصفهان"
                                    required
                                />
                            </div>
                        </div>

                        {/* Schedule Section */}
                        <div style={{ marginBottom: 'var(--space-xl)' }}>
                            <h3 className="text-h3 mb-md" style={{ color: 'var(--ui-primary)' }}>⏰ زمان و صندلی</h3>

                            <div style={{ marginBottom: 'var(--space-md)' }}>
                                <label className="text-body-sm mb-xs" style={{ display: 'block', fontWeight: '500' }}>تاریخ حرکت (شمسی)</label>
                                <input
                                    type="date"
                                    className="input"
                                    value={formData.requested_departure_start}
                                    onChange={(e) => setFormData({ ...formData, requested_departure_start: e.target.value })}
                                    min={getJalaliInputDate()}
                                    required
                                />
                            </div>

                            <div style={{ marginBottom: 'var(--space-md)' }}>
                                <label className="text-body-sm mb-xs" style={{ display: 'block', fontWeight: '500' }}>تعداد صندلی مورد نیاز</label>
                                <input
                                    type="number"
                                    className="input"
                                    value={formData.seats_needed}
                                    onChange={(e) => setFormData({ ...formData, seats_needed: e.target.value })}
                                    min="1"
                                    max="8"
                                    required
                                />
                            </div>
                        </div>

                        {/* Extra Settings */}
                        <div style={{ marginBottom: 'var(--space-xl)' }}>
                            <h3 className="text-h3 mb-md" style={{ color: 'var(--ui-primary)' }}>💰 بودجه و توضیحات</h3>

                            <div style={{ marginBottom: 'var(--space-md)' }}>
                                <label className="text-body-sm mb-xs" style={{ display: 'block', fontWeight: '500' }}>حداکثر قیمت پیشنهادی (تومان - اختیاری)</label>
                                <input
                                    type="number"
                                    className="input"
                                    value={formData.max_price_per_seat}
                                    onChange={(e) => setFormData({ ...formData, max_price_per_seat: e.target.value })}
                                    placeholder="مثلاً: 500000"
                                />
                            </div>

                            <div style={{ marginBottom: 'var(--space-md)' }}>
                                <label className="text-body-sm mb-xs" style={{ display: 'block', fontWeight: '500' }}>توضیحات تکمیلی (اختیاری)</label>
                                <textarea
                                    className="input"
                                    value={formData.notes}
                                    onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                                    placeholder="توضیحاتی برای راننده..."
                                    rows={3}
                                    style={{ resize: 'vertical' }}
                                />
                            </div>

                            <label style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: 'var(--space-md)',
                                padding: 'var(--space-md)',
                                backgroundColor: 'var(--bg-muted)',
                                borderRadius: 'var(--radius-md)',
                                cursor: 'pointer',
                            }}>
                                <input
                                    type="checkbox"
                                    checked={formData.notify_favorites}
                                    onChange={(e) => setFormData({ ...formData, notify_favorites: e.target.checked })}
                                />
                                <div style={{ flex: 1 }}>
                                    <div className="text-body" style={{ fontWeight: '600' }}>اطلاع به رانندگان برگزیده</div>
                                    <div className="text-caption">این درخواست مستقیماً برای رانندگانی که دنبال کرده‌اید ارسال می‌شود.</div>
                                </div>
                            </label>
                        </div>

                        <button
                            type="submit"
                            className="btn btn-cta btn-lg w-full"
                            disabled={loading}
                        >
                            {loading ? 'در حال ثبت...' : '🚀 ثبت درخواست و اطلاع به رانندگان'}
                        </button>
                    </form>
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

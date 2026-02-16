'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { formatJalaliDate, toPersianNumber } from '@/lib/jalali';

export default function MyTripRequestsPage() {
    const [mounted, setMounted] = useState(false);
    const [requests, setRequests] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const router = useRouter();

    useEffect(() => {
        setMounted(true);
        loadRequests();
    }, []);

    const loadRequests = async () => {
        const token = localStorage.getItem('token');
        if (!token) {
            router.push('/auth/login');
            return;
        }

        try {
            const response = await fetch(
                `${process.env.NEXT_PUBLIC_API_URL}/users/trip-requests/my`,
                {
                    headers: { 'Authorization': `Bearer ${token}` }
                }
            );
            const data = await response.json();
            if (data.success) {
                setRequests(data.data || []);
            } else {
                setError(data.error || 'خطا در دریافت اطلاعات');
            }
        } catch (err) {
            setError('خطا در ارتباط با سرور');
        } finally {
            setLoading(false);
        }
    };

    if (!mounted) return null;

    return (
        <div style={{ minHeight: '100vh', backgroundColor: 'var(--bg-main)', paddingBottom: '100px' }}>
            <header style={{
                backgroundColor: 'var(--brand-anchor)',
                padding: 'var(--space-md)',
                boxShadow: 'var(--shadow-md)',
                position: 'sticky',
                top: 0,
                zIndex: 10
            }}>
                <div className="container flex items-center justify-between">
                    <div className="flex items-center gap-md">
                        <Link href="/dashboard" style={{ color: '#FFFFFF', textDecoration: 'none', fontSize: '1.5rem' }}>←</Link>
                        <h1 className="text-h2" style={{ color: '#FFFFFF' }}>درخواست‌های سفر من</h1>
                    </div>
                </div>
            </header>

            <div className="container" style={{ padding: 'var(--space-xl) var(--space-md)' }}>
                {loading ? (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-md)' }}>
                        {[1, 2, 3].map(i => <div key={i} className="skeleton skeleton-card" style={{ height: '150px' }}></div>)}
                    </div>
                ) : error ? (
                    <div className="card" style={{ textAlign: 'center' }}>
                        <p className="text-error mb-lg">{error}</p>
                        <button onClick={loadRequests} className="btn btn-primary">تلاش مجدد</button>
                    </div>
                ) : requests.length === 0 ? (
                    <div className="card" style={{ textAlign: 'center', padding: 'var(--space-2xl)' }}>
                        <div style={{ fontSize: '4rem', marginBottom: 'var(--space-md)' }}>📋</div>
                        <h3 className="text-h3 mb-sm">درخواستی ندارید</h3>
                        <p className="text-body mb-lg" style={{ color: 'var(--text-secondary)' }}>
                            هنوز هیچ درخواست سفری ثبت نکرده‌اید.
                        </p>
                        <Link href="/trip-requests/create" className="btn btn-primary">ثبت اولین درخواست</Link>
                    </div>
                ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-md)' }}>
                        {requests.map((req) => (
                            <div key={req.id} className="card">
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: 'var(--space-md)' }}>
                                    <div>
                                        <h3 className="text-h3">{req.origin_city} ← {req.destination_city}</h3>
                                        <div className="text-body-sm" style={{ color: 'var(--text-secondary)' }}>
                                            تاریخ درخواستی: {formatJalaliDate(req.requested_departure_start * 1000)}
                                        </div>
                                    </div>
                                    <span className={`badge ${req.status === 'active' ? 'badge-success' : 'badge-muted'}`}>
                                        {req.status === 'active' ? 'فعال' : 'منقضی شده'}
                                    </span>
                                </div>
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-md)', padding: 'var(--space-md) 0', borderTop: '1px solid var(--border-default)' }}>
                                    <div>
                                        <div className="text-caption">تعداد صندلی</div>
                                        <div className="text-body" style={{ fontWeight: '600' }}>{toPersianNumber(req.seats_needed)} صندلی</div>
                                    </div>
                                    <div>
                                        <div className="text-caption">حداکثر بودجه</div>
                                        <div className="text-body" style={{ fontWeight: '600' }}>
                                            {req.max_price_per_seat ? `${toPersianNumber(req.max_price_per_seat)} تومان` : 'تعیین نشده'}
                                        </div>
                                    </div>
                                </div>
                                {req.notes && (
                                    <div style={{ padding: 'var(--space-sm) var(--space-md)', backgroundColor: 'var(--bg-muted)', borderRadius: 'var(--radius-sm)', fontSize: '0.9rem' }}>
                                        {req.notes}
                                    </div>
                                )}
                            </div>
                        ))}
                        <Link href="/trip-requests/create" className="btn btn-primary w-full" style={{ marginTop: 'var(--space-md)' }}>
                            ➕ ثبت درخواست جدید
                        </Link>
                    </div>
                )}
            </div>

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

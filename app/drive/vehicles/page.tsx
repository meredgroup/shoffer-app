'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { toPersianNumber } from '@/lib/jalali';

interface Vehicle {
    id: string;
    make: string;
    model: string;
    year: number;
    color: string;
    license_plate: string;
    total_seats: number;
    is_verified: boolean;
}

export default function VehiclesPage() {
    const [mounted, setMounted] = useState(false);
    const [vehicles, setVehicles] = useState<Vehicle[]>([]);
    const [loading, setLoading] = useState(true);
    const [showAddForm, setShowAddForm] = useState(false);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState('');
    const router = useRouter();
    const searchParams = useSearchParams();

    const [formData, setFormData] = useState({
        make: '',
        model: '',
        year: '',
        color: '',
        license_plate: '',
        total_seats: '4',
    });

    useEffect(() => {
        setMounted(true);
        const isFirst = searchParams.get('first');
        if (isFirst) {
            setShowAddForm(true);
        }
        loadVehicles();
    }, []);

    const loadVehicles = async () => {
        const token = localStorage.getItem('token');

        if (!token) {
            router.push('/auth/login');
            return;
        }

        setLoading(true);
        try {
            const response = await fetch(
                `${process.env.NEXT_PUBLIC_API_URL}/vehicles/my`,
                {
                    headers: {
                        'Authorization': `Bearer ${token}`,
                    },
                }
            );

            const data = await response.json();

            if (data.success) {
                setVehicles(data.data || []);
            }
        } catch (err) {
            console.error('Failed to load vehicles:', err);
        } finally {
            setLoading(false);
        }
    };

    const handleAddVehicle = async (e: React.FormEvent) => {
        e.preventDefault();
        const token = localStorage.getItem('token');
        if (!token) return;

        setSaving(true);
        setError('');

        try {
            const response = await fetch(
                `${process.env.NEXT_PUBLIC_API_URL}/vehicles`,
                {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${token}`,
                    },
                    body: JSON.stringify({
                        ...formData,
                        year: parseInt(formData.year),
                        total_seats: parseInt(formData.total_seats),
                    }),
                }
            );

            const data = await response.json();

            if (data.success) {
                setShowAddForm(false);
                setFormData({
                    make: '',
                    model: '',
                    year: '',
                    color: '',
                    license_plate: '',
                    total_seats: '4',
                });
                loadVehicles();
            } else {
                setError(data.error || 'خطا در افزودن خودرو');
            }
        } catch (err) {
            setError('خطا در ارتباط با سرور');
        } finally {
            setSaving(false);
        }
    };

    const handleDeleteVehicle = async (vehicleId: string) => {
        if (!confirm('آیا مطمئن هستید که می‌خواهید این خودرو را حذف کنید؟')) {
            return;
        }

        const token = localStorage.getItem('token');
        if (!token) return;

        try {
            const response = await fetch(
                `${process.env.NEXT_PUBLIC_API_URL}/vehicles/${vehicleId}`,
                {
                    method: 'DELETE',
                    headers: {
                        'Authorization': `Bearer ${token}`,
                    },
                }
            );

            const data = await response.json();

            if (data.success) {
                loadVehicles();
            }
        } catch (err) {
            console.error('Failed to delete vehicle:', err);
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
                        خودروهای من
                    </h1>
                    <Link href="/dashboard" className="btn btn-ghost" style={{ color: '#FFFFFF' }}>
                        داشبورد
                    </Link>
                </div>
            </header>

            <div className="container" style={{ padding: 'var(--space-xl) var(--space-md)' }}>
                {/* Add Vehicle Form */}
                {showAddForm ? (
                    <div className="card mb-xl">
                        <h2 className="text-h2 mb-lg">افزودن خودرو جدید</h2>

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

                        <form onSubmit={handleAddVehicle}>
                            <div style={{
                                display: 'grid',
                                gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
                                gap: 'var(--space-md)',
                                marginBottom: 'var(--space-md)',
                            }}>
                                <div>
                                    <label className="text-body-sm" style={{
                                        display: 'block',
                                        marginBottom: 'var(--space-xs)',
                                        fontWeight: '500',
                                    }}>
                                        برند
                                    </label>
                                    <input
                                        type="text"
                                        className="input"
                                        value={formData.make}
                                        onChange={(e) => setFormData({ ...formData, make: e.target.value })}
                                        placeholder="پژو"
                                        required
                                    />
                                </div>

                                <div>
                                    <label className="text-body-sm" style={{
                                        display: 'block',
                                        marginBottom: 'var(--space-xs)',
                                        fontWeight: '500',
                                    }}>
                                        مدل
                                    </label>
                                    <input
                                        type="text"
                                        className="input"
                                        value={formData.model}
                                        onChange={(e) => setFormData({ ...formData, model: e.target.value })}
                                        placeholder="۲۰۶"
                                        required
                                    />
                                </div>

                                <div>
                                    <label className="text-body-sm" style={{
                                        display: 'block',
                                        marginBottom: 'var(--space-xs)',
                                        fontWeight: '500',
                                    }}>
                                        سال ساخت
                                    </label>
                                    <input
                                        type="number"
                                        className="input"
                                        value={formData.year}
                                        onChange={(e) => setFormData({ ...formData, year: e.target.value })}
                                        placeholder="1402"
                                        min="1350"
                                        max="1410"
                                        required
                                    />
                                </div>

                                <div>
                                    <label className="text-body-sm" style={{
                                        display: 'block',
                                        marginBottom: 'var(--space-xs)',
                                        fontWeight: '500',
                                    }}>
                                        رنگ
                                    </label>
                                    <input
                                        type="text"
                                        className="input"
                                        value={formData.color}
                                        onChange={(e) => setFormData({ ...formData, color: e.target.value })}
                                        placeholder="سفید"
                                        required
                                    />
                                </div>

                                <div>
                                    <label className="text-body-sm" style={{
                                        display: 'block',
                                        marginBottom: 'var(--space-xs)',
                                        fontWeight: '500',
                                    }}>
                                        پلاک
                                    </label>
                                    <input
                                        type="text"
                                        className="input"
                                        value={formData.license_plate}
                                        onChange={(e) => setFormData({ ...formData, license_plate: e.target.value })}
                                        placeholder="۱۲ الف ۳۴۵ - ۶۷"
                                        required
                                    />
                                </div>

                                <div>
                                    <label className="text-body-sm" style={{
                                        display: 'block',
                                        marginBottom: 'var(--space-xs)',
                                        fontWeight: '500',
                                    }}>
                                        تعداد صندلی
                                    </label>
                                    <select
                                        className="input"
                                        value={formData.total_seats}
                                        onChange={(e) => setFormData({ ...formData, total_seats: e.target.value })}
                                        required
                                    >
                                        <option value="3">۳ صندلی</option>
                                        <option value="4">۴ صندلی</option>
                                        <option value="5">۵ صندلی</option>
                                        <option value="6">۶ صندلی</option>
                                        <option value="7">۷ صندلی</option>
                                    </select>
                                </div>
                            </div>

                            <div style={{ display: 'flex', gap: 'var(--space-sm)' }}>
                                <button
                                    type="button"
                                    onClick={() => setShowAddForm(false)}
                                    className="btn btn-outline"
                                    style={{ flex: 1 }}
                                >
                                    انصراف
                                </button>
                                <button
                                    type="submit"
                                    className="btn btn-primary"
                                    style={{ flex: 1 }}
                                    disabled={saving}
                                >
                                    {saving ? 'در حال ذخیره...' : '✓ افزودن خودرو'}
                                </button>
                            </div>
                        </form>
                    </div>
                ) : (
                    <button
                        onClick={() => setShowAddForm(true)}
                        className="card card-interactive mb-xl"
                        style={{
                            textDecoration: 'none',
                            background: 'linear-gradient(135deg, var(--ui-primary-soft) 0%, var(--cta-primary-soft) 100%)',
                            border: '2px solid var(--ui-primary)',
                            width: '100%',
                        }}
                    >
                        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-md)' }}>
                            <div style={{
                                width: '60px',
                                height: '60px',
                                borderRadius: '50%',
                                backgroundColor: 'var(--ui-primary)',
                                color: '#FFFFFF',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                fontSize: '2rem',
                            }}>
                                ➕
                            </div>
                            <div style={{ flex: 1, textAlign: 'right' }}>
                                <h3 className="text-h3 mb-xs">افزودن خودرو جدید</h3>
                                <p className="text-body-sm" style={{ color: 'var(--text-secondary)' }}>
                                    مشخصات خودروی خود را ثبت کنید
                                </p>
                            </div>
                        </div>
                    </button>
                )}

                {/* Vehicles List */}
                {loading ? (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-md)' }}>
                        {[1, 2].map((i) => (
                            <div key={i} className="skeleton skeleton-card" style={{ height: '150px' }}></div>
                        ))}
                    </div>
                ) : vehicles.length === 0 && !showAddForm ? (
                    <div className="card" style={{ textAlign: 'center', padding: 'var(--space-2xl)' }}>
                        <div style={{ fontSize: '4rem', marginBottom: 'var(--space-md)' }}>🚗</div>
                        <h3 className="text-h3 mb-sm">خودرویی ثبت نشده</h3>
                        <p className="text-body" style={{ color: 'var(--text-secondary)', marginBottom: 'var(--space-lg)' }}>
                            برای ایجاد سفر باید حداقل یک خودرو ثبت کنید
                        </p>
                        <button
                            onClick={() => setShowAddForm(true)}
                            className="btn btn-primary"
                        >
                            ➕ افزودن خودرو
                        </button>
                    </div>
                ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-md)' }}>
                        {vehicles.map((vehicle) => (
                            <div key={vehicle.id} className="card">
                                <div style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: 'var(--space-md)',
                                    marginBottom: 'var(--space-md)',
                                }}>
                                    <div style={{
                                        width: '80px',
                                        height: '80px',
                                        borderRadius: 'var(--radius-md)',
                                        backgroundColor: 'var(--ui-primary-soft)',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        fontSize: '2.5rem',
                                        flexShrink: 0,
                                    }}>
                                        🚗
                                    </div>

                                    <div style={{ flex: 1 }}>
                                        <h3 className="text-h3 mb-xs">
                                            {vehicle.make} {vehicle.model}
                                        </h3>
                                        <p className="text-body-sm" style={{ color: 'var(--text-secondary)' }}>
                                            {vehicle.color} • سال {toPersianNumber(vehicle.year)}
                                        </p>
                                    </div>

                                    {vehicle.is_verified && (
                                        <span className="badge badge-success">
                                            ✓ تأیید شده
                                        </span>
                                    )}
                                </div>

                                <div style={{
                                    display: 'grid',
                                    gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))',
                                    gap: 'var(--space-md)',
                                    marginBottom: 'var(--space-md)',
                                    paddingTop: 'var(--space-md)',
                                    borderTop: '1px solid var(--border-default)',
                                }}>
                                    <div>
                                        <div className="text-caption">پلاک</div>
                                        <div className="text-body" style={{ fontWeight: '600' }}>
                                            {vehicle.license_plate}
                                        </div>
                                    </div>

                                    <div>
                                        <div className="text-caption">تعداد صندلی</div>
                                        <div className="text-body" style={{ fontWeight: '600' }}>
                                            {toPersianNumber(vehicle.total_seats)} صندلی
                                        </div>
                                    </div>
                                </div>

                                <div style={{ display: 'flex', gap: 'var(--space-sm)' }}>
                                    <button
                                        onClick={() => handleDeleteVehicle(vehicle.id)}
                                        className="btn btn-ghost btn-sm"
                                        style={{ color: 'var(--error-text)' }}
                                    >
                                        🗑️ حذف
                                    </button>
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

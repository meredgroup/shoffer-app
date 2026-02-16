'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { formatJalaliDate, getJalaliInputDate } from '@/lib/jalali';

interface Vehicle {
    id: string;
    make: string;
    model: string;
    year: number;
    color: string;
    license_plate: string;
    total_seats: number;
}

export default function CreateRidePage() {
    const [mounted, setMounted] = useState(false);
    const [vehicles, setVehicles] = useState<Vehicle[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [step, setStep] = useState(1);
    const router = useRouter();

    const [formData, setFormData] = useState({
        vehicle_id: '',
        origin_city: '',
        origin_address: '',
        origin_lat: 0,
        origin_lng: 0,
        destination_city: '',
        destination_address: '',
        destination_lat: 0,
        destination_lng: 0,
        departure_date: '',
        departure_time: '',
        price_per_seat: '',
        available_seats: '',
        women_only: false,
        pets_allowed: false,
        smoking_allowed: false,
        notes: '',
    });

    useEffect(() => {
        setMounted(true);
        loadVehicles();
    }, []);

    const loadVehicles = async () => {
        const token = localStorage.getItem('token');
        if (!token) {
            router.push('/auth/login');
            return;
        }

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
        }
    };

    const handleSubmit = async () => {
        const token = localStorage.getItem('token');
        if (!token) return;

        setLoading(true);
        setError('');

        try {
            // Combine date and time to timestamp
            const departureDateTime = new Date(`${formData.departure_date}T${formData.departure_time}`);
            const departure_time = Math.floor(departureDateTime.getTime() / 1000);

            const response = await fetch(
                `${process.env.NEXT_PUBLIC_API_URL}/rides`,
                {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${token}`,
                    },
                    body: JSON.stringify({
                        ...formData,
                        departure_time,
                        price_per_seat: parseInt(formData.price_per_seat),
                        available_seats: parseInt(formData.available_seats),
                    }),
                }
            );

            const data = await response.json();

            if (data.success) {
                router.push('/drive/my-rides?new=true');
            } else {
                setError(data.error || 'خطا در ایجاد سفر');
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

    const selectedVehicle = vehicles.find(v => v.id === formData.vehicle_id);

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
                    <Link href="/dashboard" style={{
                        color: '#FFFFFF',
                        fontSize: '1.5rem',
                        textDecoration: 'none',
                    }}>
                        ←
                    </Link>
                    <h1 className="text-h2" style={{ color: '#FFFFFF', fontWeight: '700' }}>
                        ایجاد سفر جدید
                    </h1>
                </div>
            </header>

            <div className="container" style={{ padding: 'var(--space-xl) var(--space-md)' }}>
                {/* Progress Steps */}
                <div style={{
                    display: 'flex',
                    justifyContent: 'center',
                    marginBottom: 'var(--space-xl)',
                    gap: 'var(--space-md)',
                }}>
                    {[1, 2, 3].map((s) => (
                        <div key={s} style={{
                            width: '40px',
                            height: '40px',
                            borderRadius: '50%',
                            backgroundColor: step >= s ? 'var(--ui-primary)' : 'var(--bg-muted)',
                            color: step >= s ? '#FFFFFF' : 'var(--text-muted)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontWeight: '700',
                        }}>
                            {s}
                        </div>
                    ))}
                </div>

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

                {/* Step 1: Vehicle Selection */}
                {step === 1 && (
                    <div className="card">
                        <h2 className="text-h2 mb-lg">انتخاب خودرو</h2>

                        {vehicles.length === 0 ? (
                            <div style={{ textAlign: 'center', padding: 'var(--space-2xl)' }}>
                                <div style={{ fontSize: '3rem', marginBottom: 'var(--space-md)' }}>🚗</div>
                                <h3 className="text-h3 mb-sm">خودرویی ثبت نشده</h3>
                                <p className="text-body mb-lg" style={{ color: 'var(--text-secondary)' }}>
                                    ابتدا باید یک خودرو ثبت کنید
                                </p>
                                <Link href="/drive/vehicles?first=true" className="btn btn-primary">
                                    ➕ افزودن خودرو
                                </Link>
                            </div>
                        ) : (
                            <>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-md)' }}>
                                    {vehicles.map((vehicle) => (
                                        <button
                                            key={vehicle.id}
                                            onClick={() => setFormData({ ...formData, vehicle_id: vehicle.id })}
                                            className={`card ${formData.vehicle_id === vehicle.id ? 'card-interactive' : ''}`}
                                            style={{
                                                textAlign: 'right',
                                                border: formData.vehicle_id === vehicle.id
                                                    ? '2px solid var(--ui-primary)'
                                                    : '2px solid var(--border-default)',
                                            }}
                                        >
                                            <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-md)' }}>
                                                <div style={{
                                                    fontSize: '2rem',
                                                    width: '60px',
                                                    height: '60px',
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    justifyContent: 'center',
                                                    backgroundColor: 'var(--ui-primary-soft)',
                                                    borderRadius: 'var(--radius-md)',
                                                }}>
                                                    🚗
                                                </div>
                                                <div style={{ flex: 1 }}>
                                                    <h3 className="text-h3 mb-xs">
                                                        {vehicle.make} {vehicle.model}
                                                    </h3>
                                                    <p className="text-body-sm" style={{ color: 'var(--text-secondary)' }}>
                                                        {vehicle.color} • {vehicle.year} • {vehicle.license_plate}
                                                    </p>
                                                    <p className="text-caption">
                                                        💺 {vehicle.total_seats} صندلی
                                                    </p>
                                                </div>
                                                {formData.vehicle_id === vehicle.id && (
                                                    <div style={{ color: 'var(--ui-primary)', fontSize: '1.5rem' }}>✓</div>
                                                )}
                                            </div>
                                        </button>
                                    ))}
                                </div>

                                <button
                                    onClick={() => setStep(2)}
                                    className="btn btn-primary btn-lg w-full"
                                    disabled={!formData.vehicle_id}
                                    style={{ marginTop: 'var(--space-lg)' }}
                                >
                                    ادامه →
                                </button>
                            </>
                        )}
                    </div>
                )}

                {/* Step 2: Route & Time */}
                {step === 2 && (
                    <div className="card">
                        <h2 className="text-h2 mb-lg">مسیر و زمان</h2>

                        <div style={{ marginBottom: 'var(--space-md)' }}>
                            <label className="text-body-sm" style={{
                                display: 'block',
                                marginBottom: 'var(--space-xs)',
                                fontWeight: '500',
                            }}>
                                شهر مبدا
                            </label>
                            <input
                                type="text"
                                className="input"
                                value={formData.origin_city}
                                onChange={(e) => setFormData({ ...formData, origin_city: e.target.value })}
                                placeholder="تهران"
                                required
                            />
                        </div>

                        <div style={{ marginBottom: 'var(--space-md)' }}>
                            <label className="text-body-sm" style={{
                                display: 'block',
                                marginBottom: 'var(--space-xs)',
                                fontWeight: '500',
                            }}>
                                آدرس دقیق مبدا
                            </label>
                            <input
                                type="text"
                                className="input"
                                value={formData.origin_address}
                                onChange={(e) => setFormData({ ...formData, origin_address: e.target.value })}
                                placeholder="میدان آزادی"
                                required
                            />
                        </div>

                        <div style={{ marginBottom: 'var(--space-md)' }}>
                            <label className="text-body-sm" style={{
                                display: 'block',
                                marginBottom: 'var(--space-xs)',
                                fontWeight: '500',
                            }}>
                                شهر مقصد
                            </label>
                            <input
                                type="text"
                                className="input"
                                value={formData.destination_city}
                                onChange={(e) => setFormData({ ...formData, destination_city: e.target.value })}
                                placeholder="اصفهان"
                                required
                            />
                        </div>

                        <div style={{ marginBottom: 'var(--space-md)' }}>
                            <label className="text-body-sm" style={{
                                display: 'block',
                                marginBottom: 'var(--space-xs)',
                                fontWeight: '500',
                            }}>
                                آدرس دقیق مقصد
                            </label>
                            <input
                                type="text"
                                className="input"
                                value={formData.destination_address}
                                onChange={(e) => setFormData({ ...formData, destination_address: e.target.value })}
                                placeholder="میدان نقش جهان"
                                required
                            />
                        </div>

                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-md)', marginBottom: 'var(--space-md)' }}>
                            <div>
                                <label className="text-body-sm" style={{
                                    display: 'block',
                                    marginBottom: 'var(--space-xs)',
                                    fontWeight: '500',
                                }}>
                                    تاریخ حرکت (شمسی)
                                </label>
                                <input
                                    type="date"
                                    className="input"
                                    value={formData.departure_date}
                                    onChange={(e) => setFormData({ ...formData, departure_date: e.target.value })}
                                    min={getJalaliInputDate()}
                                    required
                                />
                                <p className="text-caption" style={{ marginTop: 'var(--space-xs)' }}>
                                    تقویم شمسی (هجری خورشیدی)
                                </p>
                            </div>

                            <div>
                                <label className="text-body-sm" style={{
                                    display: 'block',
                                    marginBottom: 'var(--space-xs)',
                                    fontWeight: '500',
                                }}>
                                    ساعت حرکت
                                </label>
                                <input
                                    type="time"
                                    className="input"
                                    value={formData.departure_time}
                                    onChange={(e) => setFormData({ ...formData, departure_time: e.target.value })}
                                    required
                                />
                            </div>
                        </div>

                        <div style={{ display: 'flex', gap: 'var(--space-sm)', marginTop: 'var(--space-lg)' }}>
                            <button
                                onClick={() => setStep(1)}
                                className="btn btn-outline btn-lg"
                                style={{ flex: 1 }}
                            >
                                ← قبلی
                            </button>
                            <button
                                onClick={() => setStep(3)}
                                className="btn btn-primary btn-lg"
                                style={{ flex: 1 }}
                                disabled={!formData.origin_city || !formData.destination_city || !formData.departure_date || !formData.departure_time}
                            >
                                ادامه →
                            </button>
                        </div>
                    </div>
                )}

                {/* Step 3: Price & Options */}
                {step === 3 && (
                    <div className="card">
                        <h2 className="text-h2 mb-lg">قیمت و تنظیمات</h2>

                        <div style={{ marginBottom: 'var(--space-md)' }}>
                            <label className="text-body-sm" style={{
                                display: 'block',
                                marginBottom: 'var(--space-xs)',
                                fontWeight: '500',
                            }}>
                                قیمت هر صندلی (تومان)
                            </label>
                            <input
                                type="number"
                                className="input"
                                value={formData.price_per_seat}
                                onChange={(e) => setFormData({ ...formData, price_per_seat: e.target.value })}
                                placeholder="500000"
                                min="0"
                                required
                            />
                        </div>

                        <div style={{ marginBottom: 'var(--space-lg)' }}>
                            <label className="text-body-sm" style={{
                                display: 'block',
                                marginBottom: 'var(--space-xs)',
                                fontWeight: '500',
                            }}>
                                تعداد صندلی خالی
                            </label>
                            <input
                                type="number"
                                className="input"
                                value={formData.available_seats}
                                onChange={(e) => setFormData({ ...formData, available_seats: e.target.value })}
                                max={selectedVehicle?.total_seats || 4}
                                min="1"
                                required
                            />
                            <p className="text-caption" style={{ marginTop: 'var(--space-xs)' }}>
                                حداکثر: {selectedVehicle?.total_seats || 4} صندلی
                            </p>
                        </div>

                        <div style={{ marginBottom: 'var(--space-lg)' }}>
                            <h3 className="text-h3 mb-md">گزینه‌ها</h3>

                            <label style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: 'var(--space-md)',
                                padding: 'var(--space-md)',
                                cursor: 'pointer',
                                marginBottom: 'var(--space-sm)',
                            }}>
                                <input
                                    type="checkbox"
                                    checked={formData.women_only}
                                    onChange={(e) => setFormData({ ...formData, women_only: e.target.checked })}
                                />
                                <div>
                                    <div className="text-body" style={{ fontWeight: '600' }}>ویژه بانوان</div>
                                    <div className="text-caption">فقط مسافران خانم</div>
                                </div>
                            </label>

                            <label style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: 'var(--space-md)',
                                padding: 'var(--space-md)',
                                cursor: 'pointer',
                                marginBottom: 'var(--space-sm)',
                            }}>
                                <input
                                    type="checkbox"
                                    checked={formData.pets_allowed}
                                    onChange={(e) => setFormData({ ...formData, pets_allowed: e.target.checked })}
                                />
                                <div>
                                    <div className="text-body" style={{ fontWeight: '600' }}>حیوانات خانگی مجاز</div>
                                    <div className="text-caption">مسافران می‌توانند حیوان خانگی همراه داشته باشند</div>
                                </div>
                            </label>

                            <label style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: 'var(--space-md)',
                                padding: 'var(--space-md)',
                                cursor: 'pointer',
                            }}>
                                <input
                                    type="checkbox"
                                    checked={formData.smoking_allowed}
                                    onChange={(e) => setFormData({ ...formData, smoking_allowed: e.target.checked })}
                                />
                                <div>
                                    <div className="text-body" style={{ fontWeight: '600' }}>سیگار مجاز</div>
                                    <div className="text-caption">کشیدن سیگار در خودرو مجاز است</div>
                                </div>
                            </label>
                        </div>

                        <div style={{ marginBottom: 'var(--space-lg)' }}>
                            <label className="text-body-sm" style={{
                                display: 'block',
                                marginBottom: 'var(--space-xs)',
                                fontWeight: '500',
                            }}>
                                توضیحات (اختیاری)
                            </label>
                            <textarea
                                className="input"
                                value={formData.notes}
                                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                                placeholder="توضیحات اضافی درباره سفر..."
                                rows={4}
                                style={{ resize: 'vertical' }}
                            />
                        </div>

                        <div style={{ display: 'flex', gap: 'var(--space-sm)' }}>
                            <button
                                onClick={() => setStep(2)}
                                className="btn btn-outline btn-lg"
                                style={{ flex: 1 }}
                            >
                                ← قبلی
                            </button>
                            <button
                                onClick={handleSubmit}
                                className="btn btn-cta btn-lg"
                                style={{ flex: 1 }}
                                disabled={loading || !formData.price_per_seat || !formData.available_seats}
                            >
                                {loading ? 'در حال ایجاد...' : '✓ ایجاد سفر'}
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}

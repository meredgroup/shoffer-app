'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

const ALPHABET = ['الف', 'ب', 'پ', 'ت', 'ث', 'ج', 'د', 'ز', 'س', 'ش', 'ص', 'ط', 'ع', 'ف', 'ق', 'ک', 'گ', 'ل', 'م', 'ن', 'و', 'ه', 'ی'];

export default function BecomeDriverPage() {
    const [mounted, setMounted] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const router = useRouter();

    const [vehicleData, setVehicleData] = useState({
        make: '',
        model: '',
        year: '1402',
        color: '',
        total_seats: '4',
    });

    const [plate, setPlate] = useState({
        part1: '', // 2 digits
        letter: 'ب',
        part2: '', // 3 digits
        iranCode: '', // 2 digits
    });

    useEffect(() => {
        setMounted(true);
        // Check if already a driver
        checkDriverStatus();
    }, []);

    const checkDriverStatus = async () => {
        const token = localStorage.getItem('token');
        if (!token) {
            router.push('/auth/login');
            return;
        }

        try {
            const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/users/me`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const data = await response.json();
            if (data.success && data.data.is_driver) {
                router.push('/dashboard');
            }
        } catch (err) {
            console.error(err);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        // Validate Plate
        if (plate.part1.length !== 2 || plate.part2.length !== 3 || plate.iranCode.length !== 2) {
            setError('لطفاً شماره پلاک را به طور کامل وارد کنید');
            setLoading(false);
            return;
        }

        const fullLicensePlate = `${plate.part1} ${plate.letter} ${plate.part2} - ایران ${plate.iranCode}`;
        const token = localStorage.getItem('token');
        const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8787';

        try {
            console.log('Sending request to:', `${API_URL}/users/become-driver`);
            const response = await fetch(`${API_URL}/users/become-driver`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    vehicle: {
                        ...vehicleData,
                        license_plate: fullLicensePlate
                    }
                })
            });

            console.log('Response status:', response.status);

            const text = await response.text();
            console.log('Response body:', text);

            let data;
            try {
                data = JSON.parse(text);
            } catch (e) {
                throw new Error(`Server returned non-JSON response: ${response.status} ${response.statusText}`);
            }

            if (data.success) {
                setSuccess('تبریک! شما با موفقیت راننده شدید.');
                setTimeout(() => {
                    router.push('/dashboard');
                }, 2000);
            } else {
                setError(data.error || 'خطا در ثبت درخواست');
            }
        } catch (err: any) {
            console.error('Submit error:', err);
            setError(`خطا: ${err.message || 'مشکل در ارتباط با سرور'}`);
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
                <div className="container flex items-center gap-md">
                    <Link href="/dashboard" style={{ color: '#FFFFFF', textDecoration: 'none', fontSize: '1.5rem' }}>←</Link>
                    <h1 className="text-h2" style={{ color: '#FFFFFF' }}>راننده شوید</h1>
                </div>
            </header>

            <div className="container" style={{ padding: 'var(--space-xl) var(--space-md)', maxWidth: '600px' }}>
                <div className="card">
                    <div style={{ textAlign: 'center', marginBottom: 'var(--space-xl)' }}>
                        <div style={{ fontSize: '4rem', marginBottom: 'var(--space-md)' }}>🚕</div>
                        <h2 className="text-h2 mb-sm">کسب درآمد با شوفر</h2>
                        <p className="text-body" style={{ color: 'var(--text-secondary)' }}>
                            با ثبت مشخصات خودروی خود، بلافاصله سفر ایجاد کنید و درآمد کسب کنید.
                        </p>
                    </div>

                    <form onSubmit={handleSubmit}>
                        <h3 className="text-h3 mb-md" style={{ borderBottom: '1px solid var(--border-default)', paddingBottom: 'var(--space-xs)' }}>مشخصات خودرو</h3>

                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-md)', marginBottom: 'var(--space-md)' }}>
                            <div>
                                <label className="text-body-sm mb-xs" style={{ display: 'block', fontWeight: '500' }}>برند خودرو</label>
                                <input
                                    type="text"
                                    className="input"
                                    placeholder="مثلاً پژو"
                                    value={vehicleData.make}
                                    onChange={(e) => setVehicleData({ ...vehicleData, make: e.target.value })}
                                    required
                                />
                            </div>
                            <div>
                                <label className="text-body-sm mb-xs" style={{ display: 'block', fontWeight: '500' }}>مدل خودرو</label>
                                <input
                                    type="text"
                                    className="input"
                                    placeholder="مثلاً ۲۰۶"
                                    value={vehicleData.model}
                                    onChange={(e) => setVehicleData({ ...vehicleData, model: e.target.value })}
                                    required
                                />
                            </div>
                        </div>

                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-md)', marginBottom: 'var(--space-md)' }}>
                            <div>
                                <label className="text-body-sm mb-xs" style={{ display: 'block', fontWeight: '500' }}>سال ساخت</label>
                                <input
                                    type="number"
                                    className="input"
                                    placeholder="1402"
                                    value={vehicleData.year}
                                    onChange={(e) => setVehicleData({ ...vehicleData, year: e.target.value })}
                                    required
                                />
                            </div>
                            <div>
                                <label className="text-body-sm mb-xs" style={{ display: 'block', fontWeight: '500' }}>رنگ</label>
                                <input
                                    type="text"
                                    className="input"
                                    placeholder="سفید"
                                    value={vehicleData.color}
                                    onChange={(e) => setVehicleData({ ...vehicleData, color: e.target.value })}
                                    required
                                />
                            </div>
                        </div>

                        <div style={{ marginBottom: 'var(--space-xl)' }}>
                            <label className="text-body-sm mb-xs" style={{ display: 'block', fontWeight: '500' }}>شماره پلاک</label>

                            <div style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '8px',
                                direction: 'ltr', // LTR layout for plate
                                backgroundColor: '#f0f0f0',
                                padding: '10px',
                                borderRadius: '8px',
                                border: '1px solid #ccc'
                            }}>
                                {/* Iran Code (Rightmost in reality, Leftmost in LTR flex) */}
                                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', borderRight: '1px solid #999', paddingRight: '10px' }}>
                                    <span style={{ fontSize: '10px', fontWeight: 'bold' }}>ایران</span>
                                    <input
                                        type="tel"
                                        maxLength={2}
                                        value={plate.iranCode}
                                        onChange={(e) => setPlate({ ...plate, iranCode: e.target.value.replace(/[^0-9]/g, '') })}
                                        style={{ width: '30px', textAlign: 'center', border: '1px solid #999', borderRadius: '4px', padding: '2px' }}
                                        placeholder="67"
                                    />
                                </div>

                                {/* Part 2 (3 digits) */}
                                <input
                                    type="tel"
                                    maxLength={3}
                                    value={plate.part2}
                                    onChange={(e) => setPlate({ ...plate, part2: e.target.value.replace(/[^0-9]/g, '') })}
                                    style={{ width: '40px', textAlign: 'center', fontSize: '1.2rem', fontWeight: 'bold', border: 'none', background: 'transparent' }}
                                    placeholder="345"
                                />

                                {/* Letter */}
                                <select
                                    value={plate.letter}
                                    onChange={(e) => setPlate({ ...plate, letter: e.target.value })}
                                    style={{ width: '50px', fontSize: '1rem', fontWeight: 'bold', border: '1px solid #ccc', borderRadius: '4px', textAlign: 'center' }}
                                >
                                    {ALPHABET.map(l => <option key={l} value={l}>{l}</option>)}
                                </select>

                                {/* Part 1 (2 digits) */}
                                <input
                                    type="tel"
                                    maxLength={2}
                                    value={plate.part1}
                                    onChange={(e) => setPlate({ ...plate, part1: e.target.value.replace(/[^0-9]/g, '') })}
                                    style={{ width: '35px', textAlign: 'center', fontSize: '1.2rem', fontWeight: 'bold', border: 'none', background: 'transparent' }}
                                    placeholder="12"
                                />

                                {/* Flag Strip (Decoration) */}
                                <div style={{ width: '10px', height: '40px', background: 'linear-gradient(to bottom, #2ecc71 33%, #ecf0f1 33%, #ecf0f1 66%, #e74c3c 66%)', border: '1px solid #ccc' }}></div>
                            </div>
                            <div className="text-caption mt-xs text-center" style={{ direction: 'rtl' }}>
                                مثال: ۱۲ ب ۳۴۵ - ایران ۶۷
                            </div>
                        </div>

                        <div style={{ marginBottom: 'var(--space-xl)' }}>
                            <label className="text-body-sm mb-xs" style={{ display: 'block', fontWeight: '500' }}>تعداد صندلی مسافر</label>
                            <select
                                className="input"
                                value={vehicleData.total_seats}
                                onChange={(e) => setVehicleData({ ...vehicleData, total_seats: e.target.value })}
                                required
                            >
                                <option value="1">۱ صندلی</option>
                                <option value="2">۲ صندلی</option>
                                <option value="3">۳ صندلی</option>
                                <option value="4">۴ صندلی</option>
                                <option value="5">۵ صندلی</option>
                                <option value="6">۶ صندلی</option>
                                <option value="7">۷ صندلی</option>
                            </select>
                        </div>

                        {error && (
                            <div style={{ padding: 'var(--space-md)', backgroundColor: 'var(--error-bg)', color: 'var(--error-text)', borderRadius: 'var(--radius-md)', marginBottom: 'var(--space-lg)', textAlign: 'center' }}>
                                {error}
                            </div>
                        )}

                        {success && (
                            <div style={{ padding: 'var(--space-md)', backgroundColor: 'var(--success-bg)', color: 'var(--success-text)', borderRadius: 'var(--radius-md)', marginBottom: 'var(--space-lg)', textAlign: 'center' }}>
                                {success}
                            </div>
                        )}

                        <button type="submit" className="btn btn-primary btn-lg w-full" disabled={loading}>
                            {loading ? 'در حال ثبت...' : 'تأیید و شروع رانندگی'}
                        </button>

                        <p className="text-caption mt-md" style={{ textAlign: 'center', color: 'var(--text-muted)' }}>
                            با کلیک روی دکمه بالا، شما قوانین و مقررات رانندگی شوفر را می‌پذیرید.
                        </p>
                    </form>
                </div>
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
                <Link href="/dashboard" className="bottom-nav-item">
                    <span className="bottom-nav-icon">👤</span>
                    <span>پروفایل</span>
                </Link>
            </nav>
        </div>
    );
}

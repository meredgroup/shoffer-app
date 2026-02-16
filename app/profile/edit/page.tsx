'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

export default function EditProfilePage() {
    const [mounted, setMounted] = useState(false);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const router = useRouter();

    const [formData, setFormData] = useState({
        full_name: '',
        bio: '',
        avatar_url: '',
    });

    useEffect(() => {
        setMounted(true);
        loadProfile();
    }, []);

    const loadProfile = async () => {
        const token = localStorage.getItem('token');
        if (!token) {
            router.push('/auth/login');
            return;
        }

        try {
            const response = await fetch(
                `${process.env.NEXT_PUBLIC_API_URL}/users/me`,
                {
                    headers: { 'Authorization': `Bearer ${token}` }
                }
            );
            const data = await response.json();
            if (data.success) {
                setFormData({
                    full_name: data.data.full_name || '',
                    bio: data.data.bio || '',
                    avatar_url: data.data.avatar_url || '',
                });
            }
        } catch (err) {
            setError('خطا در بارگذاری اطلاعات');
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        const token = localStorage.getItem('token');
        setSaving(true);
        setError('');
        setSuccess('');

        try {
            const response = await fetch(
                `${process.env.NEXT_PUBLIC_API_URL}/users/me`,
                {
                    method: 'PATCH',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${token}`,
                    },
                    body: JSON.stringify(formData),
                }
            );

            const data = await response.json();
            if (data.success) {
                setSuccess('پروفایل با موفقیت بروزرسانی شد');
                setTimeout(() => {
                    router.push('/dashboard');
                }, 2000);
            } else {
                setError(data.error || 'خطا در ذخیره‌سازی');
            }
        } catch (err) {
            setError('خطا در ارتباط با سرور');
        } finally {
            setSaving(false);
        }
    };

    if (!mounted) return null;

    return (
        <div style={{ minHeight: '100vh', backgroundColor: 'var(--bg-main)', paddingBottom: '100px' }}>
            <header style={{
                backgroundColor: 'var(--brand-anchor)',
                padding: 'var(--space-md)',
                boxShadow: 'var(--shadow-md)',
            }}>
                <div className="container flex items-center gap-md">
                    <Link href="/dashboard" style={{ color: '#FFFFFF', textDecoration: 'none', fontSize: '1.5rem' }}>←</Link>
                    <h1 className="text-h2" style={{ color: '#FFFFFF' }}>ویرایش پروفایل</h1>
                </div>
            </header>

            <div className="container" style={{ padding: 'var(--space-xl) var(--space-md)', maxWidth: '600px' }}>
                <div className="card">
                    {loading ? (
                        <div className="skeleton" style={{ height: '300px' }}></div>
                    ) : (
                        <form onSubmit={handleSubmit}>
                            <div style={{ textAlign: 'center', marginBottom: 'var(--space-xl)' }}>
                                <div style={{
                                    width: '100px',
                                    height: '100px',
                                    borderRadius: '50%',
                                    backgroundColor: 'var(--bg-muted)',
                                    margin: '0 auto var(--space-md)',
                                    overflow: 'hidden',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    fontSize: '3rem',
                                    border: '2px solid var(--border-default)'
                                }}>
                                    {formData.avatar_url ? <img src={formData.avatar_url} alt="Avatar" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : '👤'}
                                </div>
                                <div className="text-body-sm" style={{ color: 'var(--text-secondary)' }}>تصویر پروفایل</div>
                            </div>

                            <div style={{ marginBottom: 'var(--space-lg)' }}>
                                <label className="text-body-sm mb-xs" style={{ display: 'block', fontWeight: '500' }}>نام و نام خانوادگی</label>
                                <input
                                    type="text"
                                    className="input"
                                    value={formData.full_name}
                                    onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                                    required
                                />
                            </div>

                            <div style={{ marginBottom: 'var(--space-lg)' }}>
                                <label className="text-body-sm mb-xs" style={{ display: 'block', fontWeight: '500' }}>لینک تصویر (Avatar URL)</label>
                                <input
                                    type="url"
                                    className="input"
                                    value={formData.avatar_url}
                                    onChange={(e) => setFormData({ ...formData, avatar_url: e.target.value })}
                                    placeholder="https://example.com/avatar.jpg"
                                />
                            </div>

                            <div style={{ marginBottom: 'var(--space-xl)' }}>
                                <label className="text-body-sm mb-xs" style={{ display: 'block', fontWeight: '500' }}>درباره من (Bio)</label>
                                <textarea
                                    className="input"
                                    value={formData.bio}
                                    onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                                    placeholder="کمی درباره خودتان بنویسید..."
                                    rows={4}
                                    style={{ resize: 'vertical' }}
                                />
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

                            <div style={{ display: 'flex', gap: 'var(--space-md)' }}>
                                <Link href="/dashboard" className="btn btn-outline" style={{ flex: 1 }}>انصراف</Link>
                                <button type="submit" className="btn btn-primary" style={{ flex: 2 }} disabled={saving}>
                                    {saving ? 'در حال ذخیره...' : 'ذخیره تغییرات'}
                                </button>
                            </div>
                        </form>
                    )}
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
                <Link href="/dashboard" className="bottom-nav-item active">
                    <span className="bottom-nav-icon">👤</span>
                    <span>پروفایل</span>
                </Link>
            </nav>
        </div>
    );
}

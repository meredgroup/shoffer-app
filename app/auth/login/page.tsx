'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8787';

export default function LoginPage() {
    const [mounted, setMounted] = useState(false);
    const [config, setConfig] = useState<any>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const router = useRouter();

    useEffect(() => {
        setMounted(true);

        // Fetch feature flags
        fetch(`${API_URL}/config/public`)
            .then(res => res.json())
            .then(data => {
                if (data.success) {
                    setConfig(data.data);
                }
            })
            .catch(err => console.error('Failed to load config:', err));
    }, []);

    const handleEmailLogin = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        const formData = new FormData(e.currentTarget);

        // TODO: Get Turnstile token
        const turnstileToken = '1x00000000000000000000AA'; // Demo token

        try {
            const response = await fetch(`${API_URL}/auth/login`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    email: formData.get('email'),
                    password: formData.get('password'),
                    turnstile_token: turnstileToken,
                }),
            });

            const data = await response.json();

            if (data.success) {
                // Save token
                localStorage.setItem('token', data.data.token);
                localStorage.setItem('userId', data.data.user_id);

                // Redirect to dashboard
                router.push('/dashboard');
            } else {
                setError(data.error || 'خطا در ورود');
            }
        } catch (err) {
            setError('خطا در ارتباط با سرور');
        } finally {
            setLoading(false);
        }
    };

    const handleGoogleLogin = async () => {
        setError('');
        // TODO: Implement Google OAuth flow
        setError('ورود با Google به زودی فعال می‌شود');
    };

    if (!mounted) {
        return (
            <div style={{
                minHeight: '100vh',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
            }}>
                <div className="skeleton skeleton-card" style={{ width: '400px', height: '500px' }}></div>
            </div>
        );
    }

    return (
        <div style={{
            minHeight: '100vh',
            background: 'linear-gradient(135deg, var(--brand-anchor) 0%, var(--ui-primary) 100%)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: 'var(--space-md)',
        }}>
            <div className="card animate-slideUp" style={{
                maxWidth: '420px',
                width: '100%',
            }}>
                {/* Header */}
                <div style={{ textAlign: 'center', marginBottom: 'var(--space-xl)' }}>
                    <h1 className="text-h1" style={{ color: 'var(--brand-anchor)', marginBottom: 'var(--space-sm)' }}>
                        ورود به شوفر
                    </h1>
                    <p className="text-body" style={{ color: 'var(--text-secondary)' }}>
                        به سامانه همسفری خوش آمدید
                    </p>
                </div>

                {/* Error Message */}
                {error && (
                    <div style={{
                        padding: 'var(--space-md)',
                        backgroundColor: 'var(--error-bg)',
                        color: 'var(--error-text)',
                        borderRadius: 'var(--radius-md)',
                        marginBottom: 'var(--space-md)',
                        textAlign: 'center',
                    }}>
                        {error}
                    </div>
                )}

                {/* Email/Password Form */}
                <form onSubmit={handleEmailLogin} style={{ marginBottom: 'var(--space-lg)' }}>
                    <div style={{ marginBottom: 'var(--space-md)' }}>
                        <label className="text-body-sm" style={{
                            display: 'block',
                            marginBottom: 'var(--space-xs)',
                            fontWeight: '500',
                        }}>
                            ایمیل
                        </label>
                        <input
                            type="email"
                            name="email"
                            required
                            className="input"
                            placeholder="example@email.com"
                            disabled={loading}
                        />
                    </div>

                    <div style={{ marginBottom: 'var(--space-md)' }}>
                        <label className="text-body-sm" style={{
                            display: 'block',
                            marginBottom: 'var(--space-xs)',
                            fontWeight: '500',
                        }}>
                            رمز عبور
                        </label>
                        <input
                            type="password"
                            name="password"
                            required
                            className="input"
                            placeholder="••••••••"
                            disabled={loading}
                        />
                    </div>

                    <div style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        marginBottom: 'var(--space-lg)',
                    }}>
                        <label style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-xs)' }}>
                            <input type="checkbox" name="remember" />
                            <span className="text-body-sm">مرا به خاطر بسپار</span>
                        </label>
                        <Link href="/auth/forgot-password" className="text-body-sm" style={{
                            color: 'var(--ui-primary)',
                            textDecoration: 'none',
                        }}>
                            فراموشی رمز عبور
                        </Link>
                    </div>

                    <button
                        type="submit"
                        className="btn btn-primary w-full btn-lg"
                        disabled={loading}
                    >
                        {loading ? 'در حال ورود...' : 'ورود'}
                    </button>
                </form>

                {/* Divider */}
                <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 'var(--space-md)',
                    marginBottom: 'var(--space-lg)',
                }}>
                    <div style={{ flex: 1, height: '1px', backgroundColor: 'var(--border-default)' }}></div>
                    <span className="text-body-sm" style={{ color: 'var(--text-muted)' }}>یا</span>
                    <div style={{ flex: 1, height: '1px', backgroundColor: 'var(--border-default)' }}></div>
                </div>

                {/* Google Login */}
                <button
                    type="button"
                    onClick={handleGoogleLogin}
                    className="btn btn-outline w-full"
                    style={{ marginBottom: 'var(--space-md)' }}
                >
                    <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                        <path d="M19.6 10.227c0-.709-.064-1.39-.182-2.045H10v3.868h5.382a4.6 4.6 0 01-1.996 3.018v2.51h3.232c1.891-1.742 2.982-4.305 2.982-7.35z" fill="#4285F4" />
                        <path d="M10 20c2.7 0 4.964-.895 6.618-2.423l-3.232-2.509c-.895.6-2.04.955-3.386.955-2.605 0-4.81-1.76-5.595-4.123H1.064v2.59A9.996 9.996 0 0010 20z" fill="#34A853" />
                        <path d="M4.405 11.9c-.2-.6-.314-1.24-.314-1.9 0-.66.114-1.3.314-1.9V5.51H1.064A9.996 9.996 0 000 10c0 1.614.386 3.14 1.064 4.49l3.34-2.59z" fill="#FBBC05" />
                        <path d="M10 3.977c1.468 0 2.786.505 3.823 1.496l2.868-2.868C14.959.99 12.695 0 10 0 6.09 0 2.71 2.24 1.064 5.51l3.34 2.59C5.19 5.736 7.395 3.977 10 3.977z" fill="#EA4335" />
                    </svg>
                    ورود با Google
                </button>

                {/* Phone Login (conditional) */}
                {config?.enable_phone_login && (
                    <button
                        type="button"
                        className="btn btn-outline w-full"
                        style={{ marginBottom: 'var(--space-md)' }}
                        onClick={() => router.push('/auth/phone-login')}
                    >
                        📱 ورود با شماره تلفن
                    </button>
                )}

                {/* Register Link */}
                <div style={{
                    textAlign: 'center',
                    paddingTop: 'var(--space-md)',
                    borderTop: '1px solid var(--border-default)',
                }}>
                    <p className="text-body-sm">
                        حساب کاربری ندارید؟{' '}
                        <Link href="/auth/register" style={{
                            color: 'var(--ui-primary)',
                            fontWeight: '600',
                            textDecoration: 'none',
                        }}>
                            ثبت‌نام کنید
                        </Link>
                    </p>
                </div>
            </div>
        </div>
    );
}

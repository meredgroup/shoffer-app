'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8787';

export default function RegisterPage() {
    const [mounted, setMounted] = useState(false);
    const [config, setConfig] = useState<any>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [step, setStep] = useState<'type' | 'form'>('type');
    const [userType, setUserType] = useState<'passenger' | 'driver'>('passenger');
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

    const handleRegister = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        const formData = new FormData(e.currentTarget);

        // TODO: Get real Turnstile token
        const turnstileToken = '1x00000000000000000000AA';

        try {
            const response = await fetch(`${API_URL}/auth/register`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    email: formData.get('email'),
                    password: formData.get('password'),
                    full_name: formData.get('full_name'),
                    turnstile_token: turnstileToken,
                }),
            });

            const data = await response.json();

            if (data.success) {
                // Save token if returned
                if (data.data?.token) {
                    localStorage.setItem('token', data.data.token);
                    localStorage.setItem('userId', data.data.user_id);
                }

                // If user is a driver, redirect to vehicle setup
                if (userType === 'driver') {
                    router.push('/drive/vehicles?first=true');
                } else {
                    router.push('/dashboard');
                }
            } else {
                setError(data.error || 'خطا در ثبت‌نام');
            }
        } catch (err) {
            setError('خطا در ارتباط با سرور');
        } finally {
            setLoading(false);
        }
    };

    if (!mounted) {
        return (
            <div style={{
                minHeight: '100vh',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
            }}>
                <div className="skeleton skeleton-card" style={{ width: '500px', height: '600px' }}></div>
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
                maxWidth: '520px',
                width: '100%',
            }}>
                {/* Header */}
                <div style={{ textAlign: 'center', marginBottom: 'var(--space-xl)' }}>
                    <h1 className="text-h1" style={{ color: 'var(--brand-anchor)', marginBottom: 'var(--space-sm)' }}>
                        ثبت‌نام در شوفر
                    </h1>
                    <p className="text-body" style={{ color: 'var(--text-secondary)' }}>
                        {step === 'type' ? 'شما چه کسی هستید؟' : 'اطلاعات خود را وارد کنید'}
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

                {/* Step 1: Choose User Type */}
                {step === 'type' && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-md)' }}>
                        <button
                            onClick={() => {
                                setUserType('passenger');
                                setStep('form');
                            }}
                            className="card card-interactive"
                            style={{
                                textAlign: 'right',
                                padding: 'var(--space-lg)',
                                border: '2px solid var(--border-default)',
                            }}
                        >
                            <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-md)' }}>
                                <div style={{
                                    fontSize: '3rem',
                                    width: '80px',
                                    height: '80px',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    backgroundColor: 'var(--ui-primary-soft)',
                                    borderRadius: 'var(--radius-md)',
                                }}>
                                    🧳
                                </div>
                                <div style={{ flex: 1 }}>
                                    <h3 className="text-h3" style={{ marginBottom: 'var(--space-xs)' }}>
                                        مسافر
                                    </h3>
                                    <p className="text-body-sm" style={{ color: 'var(--text-secondary)' }}>
                                        جستجو و رزرو سفرهای موجود
                                    </p>
                                </div>
                                <div style={{ fontSize: '1.5rem', color: 'var(--ui-primary)' }}>←</div>
                            </div>
                        </button>

                        <button
                            onClick={() => {
                                setUserType('driver');
                                setStep('form');
                            }}
                            className="card card-interactive"
                            style={{
                                textAlign: 'right',
                                padding: 'var(--space-lg)',
                                border: '2px solid var(--border-default)',
                            }}
                        >
                            <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-md)' }}>
                                <div style={{
                                    fontSize: '3rem',
                                    width: '80px',
                                    height: '80px',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    backgroundColor: 'var(--cta-primary-soft)',
                                    borderRadius: 'var(--radius-md)',
                                }}>
                                    🚗
                                </div>
                                <div style={{ flex: 1 }}>
                                    <h3 className="text-h3" style={{ marginBottom: 'var(--space-xs)' }}>
                                        راننده
                                    </h3>
                                    <p className="text-body-sm" style={{ color: 'var(--text-secondary)' }}>
                                        ایجاد سفر و پذیرش مسافران
                                    </p>
                                </div>
                                <div style={{ fontSize: '1.5rem', color: 'var(--ui-primary)' }}>←</div>
                            </div>
                        </button>

                        <div style={{
                            textAlign: 'center',
                            paddingTop: 'var(--space-md)',
                            marginTop: 'var(--space-md)',
                            borderTop: '1px solid var(--border-default)',
                        }}>
                            <p className="text-body-sm">
                                قبلاً ثبت‌نام کرده‌اید؟{' '}
                                <Link href="/auth/login" style={{
                                    color: 'var(--ui-primary)',
                                    fontWeight: '600',
                                    textDecoration: 'none',
                                }}>
                                    وارد شوید
                                </Link>
                            </p>
                        </div>
                    </div>
                )}

                {/* Step 2: Registration Form */}
                {step === 'form' && (
                    <>
                        <div style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: 'var(--space-sm)',
                            marginBottom: 'var(--space-lg)',
                            padding: 'var(--space-md)',
                            backgroundColor: userType === 'driver' ? 'var(--cta-primary-soft)' : 'var(--ui-primary-soft)',
                            borderRadius: 'var(--radius-md)',
                        }}>
                            <span style={{ fontSize: '1.5rem' }}>
                                {userType === 'driver' ? '🚗' : '🧳'}
                            </span>
                            <span className="text-body" style={{ fontWeight: '600' }}>
                                ثبت‌نام به عنوان {userType === 'driver' ? 'راننده' : 'مسافر'}
                            </span>
                            <button
                                onClick={() => setStep('type')}
                                className="btn btn-ghost btn-sm"
                                style={{ marginRight: 'auto', fontSize: '0.875rem' }}
                            >
                                تغییر
                            </button>
                        </div>

                        <form onSubmit={handleRegister}>
                            <div style={{ marginBottom: 'var(--space-md)' }}>
                                <label className="text-body-sm" style={{
                                    display: 'block',
                                    marginBottom: 'var(--space-xs)',
                                    fontWeight: '500',
                                }}>
                                    نام و نام خانوادگی
                                </label>
                                <input
                                    type="text"
                                    name="full_name"
                                    required
                                    className="input"
                                    placeholder="نام کامل خود را وارد کنید"
                                    disabled={loading}
                                />
                            </div>

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
                                    minLength={8}
                                    className="input"
                                    placeholder="حداقل ۸ کاراکتر"
                                    disabled={loading}
                                />
                                <p className="text-caption" style={{ marginTop: 'var(--space-xs)' }}>
                                    رمز عبور باید حداقل ۸ کاراکتر باشد
                                </p>
                            </div>

                            <div style={{ marginBottom: 'var(--space-lg)' }}>
                                <label style={{
                                    display: 'flex',
                                    alignItems: 'start',
                                    gap: 'var(--space-sm)',
                                    cursor: 'pointer',
                                }}>
                                    <input type="checkbox" required style={{ marginTop: '4px' }} />
                                    <span className="text-body-sm">
                                        <Link href="/terms" style={{ color: 'var(--ui-primary)', textDecoration: 'none' }}>
                                            قوانین و مقررات
                                        </Link>
                                        {' '}و{' '}
                                        <Link href="/privacy" style={{ color: 'var(--ui-primary)', textDecoration: 'none' }}>
                                            حریم خصوصی
                                        </Link>
                                        {' '}را مطالعه کرده و می‌پذیرم
                                    </span>
                                </label>
                            </div>

                            <button
                                type="submit"
                                className="btn btn-cta w-full btn-lg"
                                disabled={loading}
                            >
                                {loading ? 'در حال ثبت‌نام...' : 'ثبت‌نام'}
                            </button>
                        </form>

                        <div style={{
                            textAlign: 'center',
                            paddingTop: 'var(--space-md)',
                            marginTop: 'var(--space-md)',
                            borderTop: '1px solid var(--border-default)',
                        }}>
                            <p className="text-body-sm">
                                قبلاً ثبت‌نام کرده‌اید؟{' '}
                                <Link href="/auth/login" style={{
                                    color: 'var(--ui-primary)',
                                    fontWeight: '600',
                                    textDecoration: 'none',
                                }}>
                                    وارد شوید
                                </Link>
                            </p>
                        </div>
                    </>
                )}
            </div>
        </div>
    );
}

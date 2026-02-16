'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

interface PopularRoute {
    from: string;
    to: string;
    price: string;
    slug: string;
}

export default function HomePage() {
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
    }, []);

    const popularRoutes: PopularRoute[] = [
        { from: 'تهران', to: 'اصفهان', price: '۵۰۰,۰۰۰', slug: 'tehran-to-isfahan' },
        { from: 'تهران', to: 'مشهد', price: '۱,۲۰۰,۰۰۰', slug: 'tehran-to-mashhad' },
        { from: 'تهران', to: 'شیراز', price: '۸۰۰,۰۰۰', slug: 'tehran-to-shiraz' },
        { from: 'اصفهان', to: 'شیراز', price: '۴۵۰,۰۰۰', slug: 'isfahan-to-shiraz' },
    ];

    if (!mounted) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <div className="skeleton skeleton-card" style={{ width: '300px' }}></div>
            </div>
        );
    }

    return (
        <div className="min-h-screen flex flex-col">
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
                        شوفر
                    </h1>
                    <div style={{ display: 'flex', gap: 'var(--space-sm)' }}>
                        <Link href="/auth/login" className="btn btn-ghost" style={{ color: '#FFFFFF' }}>
                            ورود
                        </Link>
                        <Link href="/auth/register" className="btn" style={{
                            backgroundColor: 'var(--cta-primary)',
                            color: '#FFFFFF'
                        }}>
                            ثبت‌نام
                        </Link>
                    </div>
                </div>
            </header>

            {/* Hero Section */}
            <section style={{
                background: 'linear-gradient(135deg, var(--brand-anchor) 0%, var(--ui-primary) 100%)',
                padding: 'var(--space-2xl) var(--space-md)',
                color: '#FFFFFF',
                textAlign: 'center',
            }} className="animate-fadeIn">
                <div className="container">
                    <h2 className="text-display mb-md">
                        سفر کن، هم‌سفر پیدا کن
                    </h2>
                    <p className="text-body-lg mb-xl" style={{ opacity: 0.9 }}>
                        امن‌ترین و مقرون‌به‌صرفه‌ترین راه برای سفرهای درون‌شهری و بین‌شهری
                    </p>

                    {/* Search Card */}
                    <div className="card" style={{
                        maxWidth: '600px',
                        margin: '0 auto',
                        background: 'rgba(255, 255, 255, 0.95)',
                        backdropFilter: 'blur(10px)',
                    }}>
                        <form onSubmit={(e) => {
                            e.preventDefault();
                            const formData = new FormData(e.currentTarget);
                            const from = formData.get('from');
                            const to = formData.get('to');
                            window.location.href = `/search?from=${from}&to=${to}`;
                        }}>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-md)' }}>
                                <input
                                    type="text"
                                    name="from"
                                    placeholder="مبدا (شهر یا آدرس)"
                                    className="input"
                                    required
                                    style={{ fontSize: '1rem' }}
                                />

                                <div style={{
                                    width: '40px',
                                    height: '40px',
                                    margin: '0 auto',
                                    borderRadius: '50%',
                                    backgroundColor: 'var(--ui-primary-soft)',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    color: 'var(--ui-primary)',
                                    fontWeight: '700',
                                    fontSize: '1.25rem'
                                }}>
                                    ↓
                                </div>

                                <input
                                    type="text"
                                    name="to"
                                    placeholder="مقصد (شهر یا آدرس)"
                                    className="input"
                                    required
                                    style={{ fontSize: '1rem' }}
                                />

                                <input
                                    type="date"
                                    name="date"
                                    className="input"
                                    defaultValue={new Date().toISOString().split('T')[0]}
                                    style={{ fontSize: '1rem' }}
                                />

                                <button type="submit" className="btn btn-cta btn-lg w-full">
                                    🔍 جستجوی سفر
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            </section>

            {/* Popular Routes */}
            <section style={{ padding: 'var(--space-2xl) var(--space-md)' }}>
                <div className="container">
                    <h3 className="text-h2 mb-lg text-center">مسیرهای پرطرفدار</h3>
                    <div style={{
                        display: 'grid',
                        gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
                        gap: 'var(--space-md)',
                    }}>
                        {popularRoutes.map((route, index) => (
                            <Link
                                key={index}
                                href={`/city/${route.slug}`}
                                className="card card-interactive"
                                style={{ textDecoration: 'none', color: 'inherit' }}
                            >
                                <div style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'space-between',
                                    marginBottom: 'var(--space-sm)',
                                }}>
                                    <span className="text-h3">{route.from}</span>
                                    <span style={{
                                        color: 'var(--ui-primary)',
                                        fontSize: '1.5rem',
                                        fontWeight: '700'
                                    }}>→</span>
                                    <span className="text-h3">{route.to}</span>
                                </div>
                                <div style={{
                                    display: 'flex',
                                    justifyContent: 'space-between',
                                    alignItems: 'center',
                                    paddingTop: 'var(--space-sm)',
                                    borderTop: '1px solid var(--border-default)',
                                }}>
                                    <span className="text-caption">قیمت از</span>
                                    <span style={{
                                        color: 'var(--cta-primary)',
                                        fontWeight: '600',
                                        fontSize: '1.125rem',
                                    }}>
                                        {route.price} تومان
                                    </span>
                                </div>
                            </Link>
                        ))}
                    </div>
                </div>
            </section>

            {/* Features */}
            <section style={{
                backgroundColor: 'var(--bg-muted)',
                padding: 'var(--space-2xl) var(--space-md)',
            }}>
                <div className="container">
                    <h3 className="text-h2 mb-xl text-center">چرا شوفر؟</h3>
                    <div style={{
                        display: 'grid',
                        gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
                        gap: 'var(--space-lg)',
                    }}>
                        <FeatureCard
                            icon="🛡️"
                            title="امن و قابل اعتماد"
                            description="تأیید هویت راننده‌ها، رتبه‌بندی و نظرات کاربران"
                        />
                        <FeatureCard
                            icon="💰"
                            title="مقرون به صرفه"
                            description="هزینه سفر را با دیگران تقسیم کنید و صرفه‌جویی کنید"
                        />
                        <FeatureCard
                            icon="💬"
                            title="چت آنی"
                            description="قبل از سفر با راننده و هم‌سفران ارتباط برقرار کنید"
                        />
                        <FeatureCard
                            icon="⭐"
                            title="رتبه‌بندی هوشمند"
                            description="انتخاب بهترین رانندگان با سیستم رتبه‌بندی شفاف"
                        />
                        <FeatureCard
                            icon="🔔"
                            title="اعلان‌های لحظه‌ای"
                            description="از سفرهای جدید رانندگان مورد علاقه‌تان باخبر شوید"
                        />
                        <FeatureCard
                            icon="📱"
                            title="اپلیکیشن PWA"
                            description="نصب آسان روی گوشی بدون نیاز به استور"
                        />
                    </div>
                </div>
            </section>

            {/* CTA Section */}
            <section style={{
                background: 'linear-gradient(135deg, var(--ui-primary) 0%, var(--brand-anchor) 100%)',
                padding: 'var(--space-2xl) var(--space-md)',
                color: '#FFFFFF',
                textAlign: 'center',
            }}>
                <div className="container">
                    <h3 className="text-h1 mb-md">راننده هستید؟</h3>
                    <p className="text-body-lg mb-lg" style={{ opacity: 0.9 }}>
                        با به اشتراک گذاشتن صندلی‌های خالی خودرو، هزینه سفر را کاهش دهید
                    </p>
                    <Link href="/auth/register?role=driver" className="btn btn-cta btn-lg">
                        ثبت‌نام به عنوان راننده
                    </Link>
                </div>
            </section>

            {/* Footer */}
            <footer style={{
                backgroundColor: 'var(--text-primary)',
                color: '#FFFFFF',
                padding: 'var(--space-xl) var(--space-md)',
                marginTop: 'auto',
            }}>
                <div className="container">
                    <div style={{
                        display: 'grid',
                        gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                        gap: 'var(--space-lg)',
                        marginBottom: 'var(--space-lg)',
                    }}>
                        <div>
                            <h4 className="text-h3 mb-md">شوفر</h4>
                            <p className="text-body-sm" style={{ opacity: 0.8 }}>
                                پلتفرم مدرن همسفری در ایران
                            </p>
                        </div>
                        <div>
                            <h4 className="text-body" style={{ fontWeight: '600', marginBottom: 'var(--space-sm)' }}>
                                لینک‌های مفید
                            </h4>
                            <ul style={{ listStyle: 'none', padding: 0 }}>
                                <li style={{ marginBottom: 'var(--space-xs)' }}>
                                    <Link href="/about" style={{ color: '#FFFFFF', opacity: 0.8, textDecoration: 'none' }}>
                                        درباره ما
                                    </Link>
                                </li>
                                <li style={{ marginBottom: 'var(--space-xs)' }}>
                                    <Link href="/help" style={{ color: '#FFFFFF', opacity: 0.8, textDecoration: 'none' }}>
                                        راهنما
                                    </Link>
                                </li>
                                <li style={{ marginBottom: 'var(--space-xs)' }}>
                                    <Link href="/contact" style={{ color: '#FFFFFF', opacity: 0.8, textDecoration: 'none' }}>
                                        تماس با ما
                                    </Link>
                                </li>
                            </ul>
                        </div>
                    </div>
                    <div style={{
                        borderTop: '1px solid rgba(255, 255, 255, 0.2)',
                        paddingTop: 'var(--space-md)',
                        textAlign: 'center',
                    }}>
                        <p className="text-body-sm" style={{ opacity: 0.7 }}>
                            © ۱۴۰۳ شوفر. تمامی حقوق محفوظ است.
                        </p>
                    </div>
                </div>
            </footer>
        </div>
    );
}

function FeatureCard({ icon, title, description }: { icon: string; title: string; description: string }) {
    return (
        <div className="card" style={{ textAlign: 'center' }}>
            <div style={{
                fontSize: '3rem',
                marginBottom: 'var(--space-md)',
            }}>
                {icon}
            </div>
            <h4 className="text-h3 mb-sm">{title}</h4>
            <p className="text-body-sm" style={{ color: 'var(--text-secondary)' }}>
                {description}
            </p>
        </div>
    );
}

import type { Metadata, Viewport } from 'next';
import './globals.css';

export const viewport: Viewport = {
    width: 'device-width',
    initialScale: 1,
    maximumScale: 1,
    themeColor: '#006D66',
};

export const metadata: Metadata = {
    title: 'شوفر - سامانه همسفری هوشمند',
    description: 'شوفر، پلتفرم مدرن همسفری در ایران. سفرهای درون‌شهری و بین‌شهری را با امنیت و راحتی به اشتراک بگذارید.',
    keywords: ['همسفری', 'شوفر', 'سفر', 'تهران', 'اصفهان', 'مشهد', 'شیراز'],
    manifest: '/manifest.json',
    icons: {
        icon: '/icon-192.svg',
        apple: '/icon-512.svg',
    },
    openGraph: {
        title: 'شوفر - سامانه همسفری هوشمند',
        description: 'سفرهای امن و مقرون به صرفه در سراسر ایران',
        type: 'website',
        locale: 'fa_IR',
        siteName: 'شوفر',
    },
    twitter: {
        card: 'summary_large_image',
        title: 'شوفر - سامانه همسفری هوشمند',
        description: 'سفرهای امن و مقرون به صرفه در سراسر ایران',
    },
};

export default function RootLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <html lang="fa" dir="rtl">
            <head>
                <link rel="preconnect" href="https://fonts.googleapis.com" />
                <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
            </head>
            <body>
                {children}

                {/* PWA Service Worker Registration */}
                <script dangerouslySetInnerHTML={{
                    __html: `
            if ('serviceWorker' in navigator) {
              window.addEventListener('load', () => {
                navigator.serviceWorker.register('/sw.js')
                  .then(reg => console.log('SW registered:', reg))
                  .catch(err => console.log('SW registration failed:', err));
              });
            }
          `
                }} />
            </body>
        </html>
    );
}

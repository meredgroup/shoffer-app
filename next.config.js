/** @type {import('next').NextConfig} */
const nextConfig = {
    reactStrictMode: true,

    // Cloudflare Pages compatibility
    images: {
        unoptimized: true, // Cloudflare Images handles optimization
    },
};

module.exports = nextConfig;

# Shoffer (شوفر) - Persian Carpooling Platform

A production-grade, mobile-first PWA for carpooling in Iran (intra-city + intercity).

## 🌟 Features

- **Persian-First**: Full RTL support, Persian UI, Jalali calendar
- **Real-Time**: WebSocket chat, live seat updates, booking concurrency
- **SEO Optimized**: Hybrid SSR/SSG for public pages
- **Secure**: Turnstile, rate limiting, input validation, auth guards
- **Follow & Favorites**: Driver relationships + trip request broadcasts
- **Admin Controls**: Feature flags, user management, audit logs

## 🔧 Tech Stack (Cloudflare-First)

- **Frontend**: Next.js 14+ (App Router) + React
- **Backend**: Cloudflare Workers (Hono)
- **Database**: Cloudflare D1 (SQLite)
- **Real-Time**: Durable Objects + WebSockets
- **Storage**: Cloudflare R2
- **Security**: Cloudflare Turnstile
- **Deploy**: Cloudflare Pages

## 📁 Project Structure

```
Shoffer/
├── app/                    # Next.js app (frontend)
├── workers/                # Cloudflare Workers (API)
├── schema/                 # D1 migrations & seed data
├── shared/                 # Shared types & utilities
├── durable-objects/        # Real-time chat & booking
└── public/                 # Static assets
```

## 🚀 Quick Start

### Prerequisites

- Node.js 18+
- Cloudflare account
- Wrangler CLI: `npm install -g wrangler`

### Local Development

1. **Install dependencies**:
```bash
npm install
```

2. **Set up D1 database**:
```bash
# Create D1 database
wrangler d1 create shoffer-db

# Run migrations
wrangler d1 execute shoffer-db --local --file=./schema/migrations/0001_init.sql
wrangler d1 execute shoffer-db --local --file=./schema/seed.sql
```

3. **Configure environment**:
```bash
cp .env.example .env.local
# Edit .env.local with your keys
```

4. **Run development server**:
```bash
npm run dev
```

Frontend: http://localhost:3000
API: http://localhost:8787

### Cloudflare Deployment

1. **Build the app**:
```bash
npm run build
```

2. **Deploy to Cloudflare Pages**:
```bash
npm run deploy
```

3. **Deploy Workers**:
```bash
cd workers
wrangler deploy
```

## 🔐 Environment Variables

### Frontend (.env.local)
```
NEXT_PUBLIC_API_URL=https://your-api.workers.dev
NEXT_PUBLIC_TURNSTILE_SITE_KEY=your_turnstile_key
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret
```

### Workers (wrangler.toml)
```
TURNSTILE_SECRET_KEY=your_turnstile_secret
GOOGLE_CLIENT_SECRET=your_google_secret
SMS_PROVIDER_API_KEY=your_sms_key (if enabled)
```

## 📊 Database Schema

See `schema/migrations/` for full schema.

Key tables:
- `users` - Authentication & profiles
- `vehicles` - Driver vehicles
- `rides` - Trip listings
- `bookings` - Seat reservations
- `messages` - Chat history
- `ratings` - Reviews
- `follows` - Social graph
- `favorite_drivers` - Favorites list
- `trip_requests` - Request broadcasts
- `app_config` - Feature flags

## 🧪 Testing

```bash
# Run tests
npm test

# Booking concurrency test
npm run test:booking

# Feature flag test
npm run test:flags
```

## 🎨 Brand Colors

- **Primary Brand**: #006D66 (Persian Deep Jade)
- **UI Primary**: #029582 (Turquoise Teal)
- **CTA**: #F2B705 (Warm Amber)
- **Secondary**: #1F3A4A (Soft Navy)

## 📱 PWA Features

- Offline support
- Add to homescreen
- Background sync
- Web push notifications

## 🌐 SEO Pages

- `/` - Homepage
- `/city/[citySlug]` - City pages (SSG)
- `/city/[route]` - Route pages (SSG)
- `/ride/[rideId]` - Ride details (SSR)
- `/driver/[driverId]` - Driver profiles (SSR)

## 🛡️ Security

- Input validation (Zod)
- Rate limiting (per IP, per user)
- Cloudflare Turnstile
- Auth guards
- Admin audit logs
- XSS protection
- CSRF tokens

## 👥 Roles

### Driver
- Create/manage rides
- Accept/reject bookings
- Chat with passengers
- Respond to trip requests

### Passenger
- Search & book rides
- Follow/favorite drivers
- Broadcast trip requests
- Rate completed trips

### Admin
- Manage users/rides/reports
- Toggle feature flags
- View audit logs

## 📞 Support

For issues or questions, please contact support@shoffer.ir

## 📄 License

Proprietary - All Rights Reserved

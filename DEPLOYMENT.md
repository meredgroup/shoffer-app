# Deployment Guide - Shoffer to Cloudflare

## Prerequisites

1. **Cloudflare Account**: Sign up at cloudflare.com
2. **Wrangler CLI**: `npm install -g wrangler`
3. **Wrangler Login**: `wrangler login`

## Step 1: Create Cloudflare Resources

### 1.1 Create D1 Database

```bash
wrangler d1 create shoffer-db
```

Copy the database ID and update `workers/wrangler.toml`:
```toml
[[d1_databases]]
binding = "DB"
database_name = "shoffer-db"
database_id = "YOUR_DATABASE_ID_HERE"  # Replace with actual ID
```

### 1.2 Create KV Namespace

```bash
wrangler kv:namespace create "shoffer-kv"
```

Update `workers/wrangler.toml`:
```toml
[[kv_namespaces]]
binding = "KV"
id = "YOUR_KV_ID_HERE"  # Replace with actual ID
```

### 1.3 Create R2 Bucket

```bash
wrangler r2 bucket create shoffer-uploads
```

This is automatically bound in wrangler.toml as `UPLOADS`.

## Step 2: Run Database Migrations

### Local (for testing):
```bash
wrangler d1 execute shoffer-db --local --file=./schema/migrations/0001_init.sql
wrangler d1 execute shoffer-db --local --file=./schema/seed.sql
```

### Production:
```bash
wrangler d1 execute shoffer-db --file=./schema/migrations/0001_init.sql
wrangler d1 execute shoffer-db --file=./schema/seed.sql
```

## Step 3: Set Up Secrets

Set environment secrets (NEVER commit these to git):

```bash
# JWT Secret (generate a strong random string!)
wrangler secret put JWT_SECRET
# When prompted, enter: PASTE_YOUR_STRONG_SECRET_HERE

# Google OAuth Client Secret
wrangler secret put GOOGLE_CLIENT_SECRET
# Enter your Google OAuth client secret

# Cloudflare Turnstile Secret Key
wrangler secret put TURNSTILE_SECRET_KEY
# Get from: https://dash.cloudflare.com/turnstile

# SMS Provider API Key (if using phone auth)
wrangler secret put SMS_PROVIDER_API_KEY
# Enter your SMS provider key
```

## Step 4: Deploy Workers API

```bash
cd workers
wrangler deploy
```

This will deploy your API to: `https://shoffer-api.YOUR_SUBDOMAIN.workers.dev`

Copy this URL for Next.js env variables.

## Step 5: Configure Next.js Environment

Create `.env.production`:

```env
NEXT_PUBLIC_API_URL=https://shoffer-api.YOUR_SUBDOMAIN.workers.dev
NEXT_PUBLIC_WS_URL=wss://shoffer-api.YOUR_SUBDOMAIN.workers.dev
NEXT_PUBLIC_TURNSTILE_SITE_KEY=1x00000000000000000000AA  # Get from Cloudflare
GOOGLE_CLIENT_ID=YOUR_GOOGLE_CLIENT_ID.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=your_secret  # Not used in frontend, but Next.js may need it
```

## Step 6: Build Next.js for Production

```bash
npm run build
```

## Step 7: Deploy to Cloudflare Pages

### Option A: Via Wrangler (Recommended)

```bash
npm install -g wrangler
wrangler pages deploy .next --project-name=shoffer
```

### Option B: Via Cloudflare Dashboard

1. Go to cloudflare.com → Pages
2. Connect your Git repository
3. Set build command: `npm run build`
4. Set build output directory: `.next`
5. Add environment variables from Step 5
6. Deploy!

## Step 8: Configure Custom Domain (Optional)

1. Go to Cloudflare Pages → Custom Domains
2. Add your domain: `shoffer.ir`
3. Cloudflare will automatically configure DNS

For the API:
1. Go to Workers → shoffer-api → Settings → Triggers
2. Add custom domain: `api.shoffer.ir`

Update `.env.production`:
```env
NEXT_PUBLIC_API_URL=https://api.shoffer.ir
NEXT_PUBLIC_WS_URL=wss://api.shoffer.ir
```

## Step 9: Google OAuth Setup

1. Go to: https://console.cloud.google.com/
2. Create a new project: "Shoffer"
3. Enable Google+ API
4. Create OAuth 2.0 credentials
5. Add authorized redirect URIs:
   - `https://shoffer.ir/auth/google/callback`
   - `http://localhost:3000/auth/google/callback` (for dev)
6. Copy Client ID and Client Secret
7. Update environment variables

## Step 10: Cloudflare Turnstile Setup

1. Go to: https://dash.cloudflare.com/turnstile
2. Add a new site
3. Domain: `shoffer.ir`
4. Copy Site Key → `NEXT_PUBLIC_TURNSTILE_SITE_KEY`
5. Copy Secret Key → Set via `wrangler secret put TURNSTILE_SECRET_KEY`

## Step 11: Generate PWA Icon

Create two icon files:
- `/public/icon-192.png` (192x192)
- `/public/icon-512.png` (512x512)

Icon should be your logo with #006D66 background.

## Step 12: Test Production Deployment

1. Visit: `https://shoffer.ir`
2. Test user registration
3. Test Google OAuth login
4. Test ride creation (as driver)
5. Test booking
6. Test chat (WebSocket)
7. Test PWA (Add to homescreen)

## Monitoring & Debugging

### View Logs

```bash
# Workers logs (real-time)
wrangler tail

# View specific request
wrangler tail --format=pretty
```

### View D1 Database

```bash
# Query production database
wrangler d1 execute shoffer-db --command="SELECT * FROM users LIMIT 10"

# Open SQL console
wrangler d1 execute shoffer-db
```

### Analytics

- Go to Cloudflare Dashboard → Analytics
- View: Requests, bandwidth, errors
- Workers Analytics shows detailed metrics

## Troubleshooting

### Issue: "Database not found"
**Solution**: Make sure database ID in `wrangler.toml` matches actual D1 database ID.

### Issue: "WebSocket connection failed"
**Solution**: Ensure Durable Objects are properly bound in `wrangler.toml`.

### Issue: "CORS error in browser"
**Solution**: Add your production domain to CORS whitelist in `workers/src/index.ts`.

### Issue: "Feature flags not loading"
**Solution**: Run seed script to populate `app_config` table.

### Issue: "JWT token invalid"
**Solution**: Make sure `JWT_SECRET` is the same in all environments.

## Performance Optimization

### Enable Caching

Add to `next.config.js`:
```js
async headers() {
  return [
    {
      source: '/static/:path*',
      headers: [
        {
          key: 'Cache-Control',
          value: 'public, max-age=31536000, immutable',
        },
      ],
    },
  ];
}
```

### Use Cloudflare Images

For user avatars and ride photos, use Cloudflare Images:
```bash
# Upload image
wrangler r2 object put shoffer-uploads/avatars/user123.jpg --file=./avatar.jpg

# Access via: https://imagedelivery.net/YOUR_ACCOUNT_HASH/user123/avatar
```

## Maintenance

### Update Database Schema

1. Create new migration file: `schema/migrations/0002_add_feature.sql`
2. Run locally: `wrangler d1 execute shoffer-db --local --file=./schema/migrations/0002_add_feature.sql`
3. Test thoroughly
4. Run in production: `wrangler d1 execute shoffer-db --file=./schema/migrations/0002_add_feature.sql`

### Update Workers Code

```bash
cd workers
wrangler deploy
```

### Update Next.js

```bash
npm run build
wrangler pages deploy .next --project-name=shoffer
```

## Cost Estimation (Cloudflare Free Tier)

- **Workers**: 100,000 requests/day FREE
- **D1**: 5 GB storage, 5M reads/day FREE
- **KV**: 1 GB storage, 100K reads/day FREE
- **R2**: 10 GB storage, 1M reads/month FREE
- **Pages**: Unlimited requests FREE

For most MVP use cases, you'll stay within free tier!

## Security Checklist

- ✅ Enable HTTPS (automatic with Cloudflare)
- ✅ Set strong JWT_SECRET
- ✅ Enable Turnstile on auth endpoints
- ✅ Configure CSP headers
- ✅ Regular dependency updates
- ✅ Monitor error logs
- ✅ Enable rate limiting
- ✅ Use prepared statements (done)

## Next Steps

1. Set up monitoring (Sentry, LogRocket)
2. Configure automated backups for D1
3. Set up CI/CD (GitHub Actions)
4. Load testing
5. SEO optimization
6. Marketing & user acquisition!

---

**Deployment Complete! 🚀**

Your Shoffer app is now live on Cloudflare's global network with:
- Sub-100ms latency worldwide
- Automatic scaling
- DDoS protection
- Free SSL/TLS

Happy carpooling! 🚗

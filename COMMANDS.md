# 🚀 Shoffer - Quick Command Reference

## 📦 Setup & Installation

```bash
# Clone/navigate to project
cd Shoffer

# Install dependencies
npm install

# Copy environment template
cp .env.example .env.local

# Edit .env.local with your keys
```

## 🗄️ Database Commands

```bash
# Create D1 database (Cloudflare)
wrangler d1 create shoffer-db

# Run migrations (local)
wrangler d1 execute shoffer-db --local --file=./schema/migrations/0001_init.sql

# Run seed data (local)
wrangler d1 execute shoffer-db --local --file=./schema/seed.sql

# Run migrations (production)
wrangler d1 execute shoffer-db --file=./schema/migrations/0001_init.sql

# Query database (local)
wrangler d1 execute shoffer-db --local --command="SELECT * FROM users LIMIT 5"

# Query database (production)
wrangler d1 execute shoffer-db --command="SELECT * FROM users LIMIT 5"

# Open SQL console (local)
wrangler d1 execute shoffer-db --local

# Backup database (export to JSON)
wrangler d1 export shoffer-db > backup.json
```

## 🔧 Development

```bash
# Start Next.js frontend (port 3000)
npm run dev

# Start Workers API (port 8787) - in separate terminal
npm run workers:dev

# Or use package.json scripts:
cd workers
wrangler dev

# Build frontend
npm run build

# Lint code
npm run lint

# Type check
npx tsc --noEmit
```

## 🚀 Deployment

```bash
# Deploy Workers API
cd workers
wrangler deploy

# Deploy Next.js to Cloudflare Pages
npm run build
wrangler pages deploy .next --project-name=shoffer

# Deploy both (if using custom script)
npm run deploy
```

## 🔐 Secrets Management

```bash
# Set secrets for Workers
wrangler secret put JWT_SECRET
# Then paste your secret when prompted

wrangler secret put GOOGLE_CLIENT_SECRET
wrangler secret put TURNSTILE_SECRET_KEY
wrangler secret put SMS_PROVIDER_API_KEY

# List secrets
wrangler secret list

# Delete secret
wrangler secret delete SECRET_NAME
```

## 📊 Monitoring & Debugging

```bash
# View real-time logs
wrangler tail

# View formatted logs
wrangler tail --format=pretty

# Filter logs
wrangler tail --status=error

# View specific request
wrangler tail --header="X-Request-ID: abc123"

# View D1 metrics
wrangler d1 info shoffer-db

# View KV metrics
wrangler kv:namespace list
```

## 🧪 Testing

```bash
# Run tests (when implemented)
npm test

# Run specific test
npm test -- bookings.test.ts

# Test with coverage
npm test -- --coverage

# Manual API testing with curl
curl -X POST http://localhost:8787/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@shoffer.ir",
    "password": "shoffer123",
    "full_name": "تست کاربر",
    "turnstile_token": "1x00000000000000000000AA"
  }'

# Test WebSocket
wscat -c ws://localhost:8787/chat/ws?userId=user1&otherUserId=user2
```

## 📦 Resource Management

```bash
# Create KV namespace
wrangler kv:namespace create "shoffer-kv"

# List KV namespaces
wrangler kv:namespace list

# Create R2 bucket
wrangler r2 bucket create shoffer-uploads

# List R2 buckets
wrangler r2 bucket list

# Upload to R2
wrangler r2 object put shoffer-uploads/test.jpg --file=./test.jpg

# List R2 objects
wrangler r2 object list shoffer-uploads

# Delete R2 object
wrangler r2 object delete shoffer-uploads/test.jpg
```

## 🔄 Data Management

```bash
# Export all data from a table
wrangler d1 execute shoffer-db --local --command="SELECT * FROM rides" --json > rides.json

# Import data (write migration script)
cat import.sql | wrangler d1 execute shoffer-db --local

# Reset database (DANGEROUS!)
wrangler d1 execute shoffer-db --local --command="DROP TABLE IF EXISTS users; DROP TABLE IF EXISTS rides;"
npm run db:migrate
npm run db:seed

# Clear rate limits
wrangler d1 execute shoffer-db --command="DELETE FROM rate_limits WHERE expires_at < strftime('%s', 'now')"
```

## 🌐 Domain & DNS

```bash
# Add custom domain to Pages
wrangler pages deployment create shoffer --branch=main

# Add custom domain to Workers
wrangler publish
# Then in dashboard: Workers > shoffer-api > Triggers > Add Custom Domain

# View domains
wrangler pages deployment list --project-name=shoffer
```

## 📈 Analytics

```bash
# View Workers analytics
wrangler tail --metrics-sample-rate=1

# View GraphQL analytics (advanced)
wrangler graphql
# Then query for metrics
```

## 🛠️ Troubleshooting

```bash
# Check Wrangler version
wrangler --version

# Update Wrangler
npm install -g wrangler@latest

# Clear Wrangler cache
rm -rf ~/.wrangler

# Verify Workers deployment
curl https://shoffer-api.YOUR_SUBDOMAIN.workers.dev/health

# Verify D1 connection
wrangler d1 execute shoffer-db --local --command="SELECT 1"

# Check environment variables
wrangler secret list

# Validate wrangler.toml
wrangler publish --dry-run

# Debug build errors
npm run build -- --verbose
```

## 🔄 Common Workflows

### Adding a New Feature Flag

```bash
# 1. Add to database
wrangler d1 execute shoffer-db --command="
INSERT INTO app_config (key, value, value_type, description, updated_at) 
VALUES ('new_feature_enabled', 'false', 'boolean', 'Enable new feature', strftime('%s', 'now'))
"

# 2. Update types.ts (FeatureFlags interface)
# 3. Update workers/src/utils/config.ts
# 4. Deploy Workers
cd workers && wrangler deploy
```

### Adding a New Table

```bash
# 1. Create migration: schema/migrations/0002_add_table.sql
# 2. Test locally
wrangler d1 execute shoffer-db --local --file=./schema/migrations/0002_add_table.sql

# 3. Verify
wrangler d1 execute shoffer-db --local --command="SELECT * FROM new_table"

# 4. Deploy to production
wrangler d1 execute shoffer-db --file=./schema/migrations/0002_add_table.sql
```

### Deploying a Hotfix

```bash
# 1. Make changes
# 2. Test locally
npm run dev
npm run workers:dev

# 3. Build
npm run build

# 4. Deploy Workers immediately
cd workers && wrangler deploy

# 5. Deploy frontend
wrangler pages deploy .next --project-name=shoffer

# 6. Verify
curl https://api.shoffer.ir/health
```

## 📝 Environment Variables Reference

### Development (.env.local)
```env
NEXT_PUBLIC_API_URL=http://localhost:8787
NEXT_PUBLIC_WS_URL=ws://localhost:8787
NEXT_PUBLIC_TURNSTILE_SITE_KEY=1x00000000000000000000AA
GOOGLE_CLIENT_ID=your_dev_client_id
```

### Production (Cloudflare Pages Dashboard)
```env
NEXT_PUBLIC_API_URL=https://api.shoffer.ir
NEXT_PUBLIC_WS_URL=wss://api.shoffer.ir
NEXT_PUBLIC_TURNSTILE_SITE_KEY=your_prod_site_key
GOOGLE_CLIENT_ID=your_prod_client_id
```

### Workers Secrets (set via wrangler secret put)
- `JWT_SECRET`
- `GOOGLE_CLIENT_SECRET`
- `TURNSTILE_SECRET_KEY`
- `SMS_PROVIDER_API_KEY`

## 🎯 Pre-Launch Checklist

```bash
# Run all checks
[] npm run lint
[] npm run build (no errors)
[] wrangler publish --dry-run
[] Database migrations applied
[] All secrets set (wrangler secret list)
[] Feature flags configured
[] Test user accounts created
[] Google OAuth configured
[] Turnstile keys set
[] Custom domain configured
[] SSL/TLS enabled (automatic)
[] PWA icons uploaded
[] Analytics configured
[] Error monitoring set up
```

## 📞 Getting Help

```bash
# Wrangler help
wrangler --help
wrangler d1 --help
wrangler pages --help

# Next.js help
npx next --help

# View project documentation
cat README.md
cat IMPLEMENTATION_GUIDE.md
cat DEPLOYMENT.md
cat SYSTEM_OVERVIEW.md
```

---

**Quick Links:**
- Cloudflare Dashboard: https://dash.cloudflare.com
- Workers Docs: https://developers.cloudflare.com/workers
- D1 Docs: https://developers.cloudflare.com/d1
- Pages Docs: https://developers.cloudflare.com/pages
- Next.js Docs: https://nextjs.org/docs

**Need help?** Check SYSTEM_OVERVIEW.md for architecture details!

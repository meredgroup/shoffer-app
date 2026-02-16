-- Shoffer Database Schema
-- Cloudflare D1 (SQLite)
-- Migration 0001: Initial Schema

-- ============================================
-- 1. USERS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY, -- nanoid
  email TEXT UNIQUE,
  email_verified INTEGER DEFAULT 0, -- boolean
  phone TEXT UNIQUE,
  phone_verified INTEGER DEFAULT 0, -- boolean
  google_id TEXT UNIQUE,
  password_hash TEXT, -- for email/password auth
  
  -- Profile
  full_name TEXT NOT NULL,
  avatar_url TEXT,
  bio TEXT,
  rating REAL DEFAULT 0.0,
  total_ratings INTEGER DEFAULT 0,
  
  -- Role flags
  is_driver INTEGER DEFAULT 0,
  is_admin INTEGER DEFAULT 0,
  
  -- Status
  status TEXT DEFAULT 'active', -- active|suspended|banned
  created_at INTEGER NOT NULL, -- unix timestamp
  updated_at INTEGER NOT NULL,
  
  -- Constraints
  CHECK (email IS NOT NULL OR phone IS NOT NULL OR google_id IS NOT NULL),
  CHECK (rating >= 0 AND rating <= 5)
);

CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_phone ON users(phone);
CREATE INDEX idx_users_google_id ON users(google_id);
CREATE INDEX idx_users_status ON users(status);

-- ============================================
-- 2. APP CONFIG / FEATURE FLAGS
-- ============================================
CREATE TABLE IF NOT EXISTS app_config (
  key TEXT PRIMARY KEY,
  value TEXT NOT NULL,
  value_type TEXT DEFAULT 'string', -- string|boolean|number|json
  description TEXT,
  updated_at INTEGER NOT NULL,
  updated_by TEXT, -- admin user_id
  FOREIGN KEY (updated_by) REFERENCES users(id)
);

-- Insert default feature flags
INSERT INTO app_config (key, value, value_type, description, updated_at) VALUES
('enable_phone_login', 'false', 'boolean', 'Enable phone number + SMS authentication', strftime('%s', 'now')),
('require_phone_verification_for_booking', 'false', 'boolean', 'Require phone verification before booking', strftime('%s', 'now')),
('max_trip_requests_per_day', '5', 'number', 'Max trip requests a passenger can send per day', strftime('%s', 'now')),
('map_provider', 'neshan', 'string', 'Map provider: neshan|balad|list', strftime('%s', 'now'));

-- ============================================
-- 3. VEHICLES
-- ============================================
CREATE TABLE IF NOT EXISTS vehicles (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  
  -- Vehicle details
  make TEXT NOT NULL, -- e.g., "پژو"
  model TEXT NOT NULL, -- e.g., "206"
  year INTEGER,
  color TEXT,
  license_plate TEXT NOT NULL,
  
  -- Capacity
  total_seats INTEGER NOT NULL DEFAULT 4,
  
  -- Verification
  is_verified INTEGER DEFAULT 0,
  
  -- Status
  is_active INTEGER DEFAULT 1,
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL,
  
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  CHECK (total_seats > 0 AND total_seats <= 8)
);

CREATE INDEX idx_vehicles_user_id ON vehicles(user_id);
CREATE INDEX idx_vehicles_active ON vehicles(is_active);

-- ============================================
-- 4. RIDES
-- ============================================
CREATE TABLE IF NOT EXISTS rides (
  id TEXT PRIMARY KEY,
  driver_id TEXT NOT NULL,
  vehicle_id TEXT NOT NULL,
  
  -- Route
  origin_city TEXT NOT NULL,
  origin_address TEXT NOT NULL,
  origin_lat TEXT,
  origin_lng TEXT,
  
  destination_city TEXT NOT NULL,
  destination_address TEXT NOT NULL,
  destination_lat TEXT,
  destination_lng TEXT,
  
  -- Schedule
  departure_time INTEGER NOT NULL, -- unix timestamp
  estimated_duration INTEGER, -- minutes
  
  -- Pricing
  price_per_seat INTEGER NOT NULL, -- Toman
  
  -- Capacity
  total_seats INTEGER NOT NULL,
  available_seats INTEGER NOT NULL,
  
  -- Options
  women_only INTEGER DEFAULT 0,
  pets_allowed INTEGER DEFAULT 0,
  smoking_allowed INTEGER DEFAULT 0,
  
  -- Notes
  notes TEXT,
  
  -- Status
  status TEXT DEFAULT 'active', -- active|full|cancelled|completed
  
  -- SEO
  slug TEXT UNIQUE, -- for /ride/tehran-to-isfahan-1234
  
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL,
  
  FOREIGN KEY (driver_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (vehicle_id) REFERENCES vehicles(id),
  CHECK (available_seats >= 0 AND available_seats <= total_seats),
  CHECK (price_per_seat >= 0)
);

CREATE INDEX idx_rides_driver_id ON rides(driver_id);
CREATE INDEX idx_rides_origin_city ON rides(origin_city);
CREATE INDEX idx_rides_destination_city ON rides(destination_city);
CREATE INDEX idx_rides_departure_time ON rides(departure_time);
CREATE INDEX idx_rides_status ON rides(status);
CREATE INDEX idx_rides_slug ON rides(slug);

-- ============================================
-- 5. BOOKINGS
-- ============================================
CREATE TABLE IF NOT EXISTS bookings (
  id TEXT PRIMARY KEY,
  ride_id TEXT NOT NULL,
  passenger_id TEXT NOT NULL,
  
  -- Booking details
  seats_booked INTEGER NOT NULL DEFAULT 1,
  total_price INTEGER NOT NULL,
  
  -- Status
  status TEXT DEFAULT 'REQUESTED', -- REQUESTED|CONFIRMED|CANCELLED|COMPLETED
  
  -- Payment
  payment_method TEXT DEFAULT 'CASH', -- CASH|ONLINE
  payment_status TEXT DEFAULT 'PENDING', -- PENDING|PAID|REFUNDED
  
  -- Idempotency
  idempotency_key TEXT UNIQUE,
  
  -- Timestamps
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL,
  confirmed_at INTEGER,
  cancelled_at INTEGER,
  completed_at INTEGER,
  
  FOREIGN KEY (ride_id) REFERENCES rides(id) ON DELETE CASCADE,
  FOREIGN KEY (passenger_id) REFERENCES users(id) ON DELETE CASCADE,
  CHECK (seats_booked > 0),
  CHECK (total_price >= 0)
);

CREATE INDEX idx_bookings_ride_id ON bookings(ride_id);
CREATE INDEX idx_bookings_passenger_id ON bookings(passenger_id);
CREATE INDEX idx_bookings_status ON bookings(status);
CREATE INDEX idx_bookings_idempotency_key ON bookings(idempotency_key);

-- ============================================
-- 6. MESSAGES (Chat)
-- ============================================
CREATE TABLE IF NOT EXISTS messages (
  id TEXT PRIMARY KEY,
  conversation_id TEXT NOT NULL, -- combination of user IDs
  sender_id TEXT NOT NULL,
  receiver_id TEXT NOT NULL,
  
  -- Content
  content TEXT NOT NULL,
  content_type TEXT DEFAULT 'text', -- text|image|location
  
  -- Status
  is_read INTEGER DEFAULT 0,
  read_at INTEGER,
  
  -- Timestamps
  created_at INTEGER NOT NULL,
  
  FOREIGN KEY (sender_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (receiver_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE INDEX idx_messages_conversation_id ON messages(conversation_id);
CREATE INDEX idx_messages_sender_id ON messages(sender_id);
CREATE INDEX idx_messages_receiver_id ON messages(receiver_id);
CREATE INDEX idx_messages_created_at ON messages(created_at);

-- ============================================
-- 7. RATINGS
-- ============================================
CREATE TABLE IF NOT EXISTS ratings (
  id TEXT PRIMARY KEY,
  booking_id TEXT NOT NULL UNIQUE, -- one rating per booking
  
  -- Participants
  reviewer_id TEXT NOT NULL,
  reviewed_id TEXT NOT NULL,
  
  -- Rating
  stars INTEGER NOT NULL,
  review_text TEXT,
  
  -- Timestamp
  created_at INTEGER NOT NULL,
  
  FOREIGN KEY (booking_id) REFERENCES bookings(id) ON DELETE CASCADE,
  FOREIGN KEY (reviewer_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (reviewed_id) REFERENCES users(id) ON DELETE CASCADE,
  CHECK (stars >= 1 AND stars <= 5)
);

CREATE INDEX idx_ratings_booking_id ON ratings(booking_id);
CREATE INDEX idx_ratings_reviewed_id ON ratings(reviewed_id);

-- ============================================
-- 8. FOLLOWS (Social Graph)
-- ============================================
CREATE TABLE IF NOT EXISTS follows (
  id TEXT PRIMARY KEY,
  follower_id TEXT NOT NULL,
  followed_id TEXT NOT NULL,
  
  created_at INTEGER NOT NULL,
  
  FOREIGN KEY (follower_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (followed_id) REFERENCES users(id) ON DELETE CASCADE,
  UNIQUE(follower_id, followed_id)
);

CREATE INDEX idx_follows_follower_id ON follows(follower_id);
CREATE INDEX idx_follows_followed_id ON follows(followed_id);

-- ============================================
-- 9. FAVORITE DRIVERS
-- ============================================
CREATE TABLE IF NOT EXISTS favorite_drivers (
  id TEXT PRIMARY KEY,
  passenger_id TEXT NOT NULL,
  driver_id TEXT NOT NULL,
  
  created_at INTEGER NOT NULL,
  
  FOREIGN KEY (passenger_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (driver_id) REFERENCES users(id) ON DELETE CASCADE,
  UNIQUE(passenger_id, driver_id)
);

CREATE INDEX idx_favorite_drivers_passenger_id ON favorite_drivers(passenger_id);
CREATE INDEX idx_favorite_drivers_driver_id ON favorite_drivers(driver_id);

-- ============================================
-- 10. TRIP REQUESTS
-- ============================================
CREATE TABLE IF NOT EXISTS trip_requests (
  id TEXT PRIMARY KEY,
  passenger_id TEXT NOT NULL,
  
  -- Route
  origin_city TEXT NOT NULL,
  origin_address TEXT,
  destination_city TEXT NOT NULL,
  destination_address TEXT,
  
  -- Schedule
  requested_departure_start INTEGER NOT NULL, -- unix timestamp
  requested_departure_end INTEGER, -- time window end
  
  -- Requirements
  seats_needed INTEGER NOT NULL DEFAULT 1,
  max_price_per_seat INTEGER, -- budget
  notes TEXT,
  
  -- Notification settings
  notify_favorites INTEGER DEFAULT 1, -- send to favorite drivers
  
  -- Status
  status TEXT DEFAULT 'active', -- active|fulfilled|cancelled|expired
  
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL,
  expires_at INTEGER, -- auto-expire old requests
  
  FOREIGN KEY (passenger_id) REFERENCES users(id) ON DELETE CASCADE,
  CHECK (seats_needed > 0)
);

CREATE INDEX idx_trip_requests_passenger_id ON trip_requests(passenger_id);
CREATE INDEX idx_trip_requests_status ON trip_requests(status);
CREATE INDEX idx_trip_requests_expires_at ON trip_requests(expires_at);

-- ============================================
-- 11. TRIP REQUEST RECIPIENTS
-- ============================================
CREATE TABLE IF NOT EXISTS trip_request_recipients (
  id TEXT PRIMARY KEY,
  trip_request_id TEXT NOT NULL,
  driver_id TEXT NOT NULL,
  
  -- Response
  status TEXT DEFAULT 'sent', -- sent|viewed|responded|muted
  viewed_at INTEGER,
  responded_at INTEGER,
  
  -- Driver actions
  is_muted INTEGER DEFAULT 0, -- driver muted this request
  
  created_at INTEGER NOT NULL,
  
  FOREIGN KEY (trip_request_id) REFERENCES trip_requests(id) ON DELETE CASCADE,
  FOREIGN KEY (driver_id) REFERENCES users(id) ON DELETE CASCADE,
  UNIQUE(trip_request_id, driver_id)
);

CREATE INDEX idx_trip_request_recipients_request_id ON trip_request_recipients(trip_request_id);
CREATE INDEX idx_trip_request_recipients_driver_id ON trip_request_recipients(driver_id);

-- ============================================
-- 12. NOTIFICATION PREFERENCES
-- ============================================
CREATE TABLE IF NOT EXISTS notification_prefs (
  user_id TEXT PRIMARY KEY,
  
  -- Notification toggles
  enable_new_rides_from_followed INTEGER DEFAULT 1,
  enable_trip_requests INTEGER DEFAULT 1, -- for drivers
  enable_chat_notifications INTEGER DEFAULT 1,
  enable_booking_notifications INTEGER DEFAULT 1,
  enable_ride_reminders INTEGER DEFAULT 1,
  
  updated_at INTEGER NOT NULL,
  
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- ============================================
-- 13. PUSH SUBSCRIPTIONS
-- ============================================
CREATE TABLE IF NOT EXISTS push_subscriptions (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  
  -- Web Push subscription data (JSON)
  endpoint TEXT NOT NULL UNIQUE,
  p256dh TEXT NOT NULL,
  auth TEXT NOT NULL,
  
  -- Metadata
  user_agent TEXT,
  created_at INTEGER NOT NULL,
  last_used_at INTEGER NOT NULL,
  
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE INDEX idx_push_subscriptions_user_id ON push_subscriptions(user_id);

-- ============================================
-- 14. NOTIFICATION LOG
-- ============================================
CREATE TABLE IF NOT EXISTS notification_log (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  
  -- Notification
  type TEXT NOT NULL, -- new_ride|trip_request|chat|booking|reminder
  title TEXT NOT NULL,
  body TEXT,
  data TEXT, -- JSON
  
  -- Delivery
  sent_at INTEGER NOT NULL,
  delivered INTEGER DEFAULT 0,
  read INTEGER DEFAULT 0,
  
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE INDEX idx_notification_log_user_id ON notification_log(user_id);
CREATE INDEX idx_notification_log_sent_at ON notification_log(sent_at);

-- ============================================
-- 15. BLOCKS / MUTES
-- ============================================
CREATE TABLE IF NOT EXISTS blocks (
  id TEXT PRIMARY KEY,
  blocker_id TEXT NOT NULL,
  blocked_id TEXT NOT NULL,
  
  reason TEXT,
  created_at INTEGER NOT NULL,
  
  FOREIGN KEY (blocker_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (blocked_id) REFERENCES users(id) ON DELETE CASCADE,
  UNIQUE(blocker_id, blocked_id)
);

CREATE INDEX idx_blocks_blocker_id ON blocks(blocker_id);
CREATE INDEX idx_blocks_blocked_id ON blocks(blocked_id);

-- ============================================
-- 16. REPORTS
-- ============================================
CREATE TABLE IF NOT EXISTS reports (
  id TEXT PRIMARY KEY,
  reporter_id TEXT NOT NULL,
  
  -- Report target
  reported_user_id TEXT,
  reported_ride_id TEXT,
  
  -- Report details
  reason TEXT NOT NULL,
  description TEXT,
  
  -- Status
  status TEXT DEFAULT 'pending', -- pending|reviewed|resolved|dismissed
  admin_notes TEXT,
  resolved_by TEXT, -- admin user_id
  resolved_at INTEGER,
  
  created_at INTEGER NOT NULL,
  
  FOREIGN KEY (reporter_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (reported_user_id) REFERENCES users(id) ON DELETE SET NULL,
  FOREIGN KEY (reported_ride_id) REFERENCES rides(id) ON DELETE SET NULL,
  FOREIGN KEY (resolved_by) REFERENCES users(id),
  CHECK (reported_user_id IS NOT NULL OR reported_ride_id IS NOT NULL)
);

CREATE INDEX idx_reports_reporter_id ON reports(reporter_id);
CREATE INDEX idx_reports_reported_user_id ON reports(reported_user_id);
CREATE INDEX idx_reports_status ON reports(status);

-- ============================================
-- 17. ADMIN AUDIT LOG
-- ============================================
CREATE TABLE IF NOT EXISTS admin_audit_log (
  id TEXT PRIMARY KEY,
  admin_id TEXT NOT NULL,
  
  -- Action
  action TEXT NOT NULL, -- suspend_user|disable_ride|update_config|etc.
  target_type TEXT, -- user|ride|report|config
  target_id TEXT,
  
  -- Details
  details TEXT, -- JSON
  
  created_at INTEGER NOT NULL,
  
  FOREIGN KEY (admin_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE INDEX idx_admin_audit_log_admin_id ON admin_audit_log(admin_id);
CREATE INDEX idx_admin_audit_log_created_at ON admin_audit_log(created_at);

-- ============================================
-- 18. RATE LIMITING
-- ============================================
CREATE TABLE IF NOT EXISTS rate_limits (
  id TEXT PRIMARY KEY,
  key TEXT NOT NULL UNIQUE, -- e.g., "trip_request:{user_id}:{date}"
  
  count INTEGER NOT NULL DEFAULT 1,
  window_start INTEGER NOT NULL,
  expires_at INTEGER NOT NULL
);

CREATE INDEX idx_rate_limits_key ON rate_limits(key);
CREATE INDEX idx_rate_limits_expires_at ON rate_limits(expires_at);

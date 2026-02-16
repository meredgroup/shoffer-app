-- Seed Data for Shoffer
-- Test users, rides, and demo data

-- Insert test users
INSERT INTO users (id, email, email_verified, full_name, password_hash, is_driver, rating, total_ratings, status, created_at, updated_at) VALUES
('user_admin_001', 'admin@shoffer.ir', 1, 'مدیر سیستم', '$2a$10$abcdefghijklmnopqrstuvwxyz1234567890', 1, 5.0, 0, 'active', strftime('%s', 'now'), strftime('%s', 'now')),
('user_driver_001', 'driver1@example.com', 1, 'محمد رضایی', '$2a$10$abcdefghijklmnopqrstuvwxyz1234567890', 1, 4.8, 24, 'active', strftime('%s', 'now'), strftime('%s', 'now')),
('user_driver_002', 'driver2@example.com', 1, 'فاطمه احمدی', '$2a$10$abcdefghijklmnopqrstuvwxyz1234567890', 1, 4.9, 35, 'active', strftime('%s', 'now'), strftime('%s', 'now')),
('user_passenger_001', 'passenger1@example.com', 1, 'علی کریمی', '$2a$10$abcdefghijklmnopqrstuvwxyz1234567890', 0, 4.5, 10, 'active', strftime('%s', 'now'), strftime('%s', 'now'));

-- Mark admin
UPDATE users SET is_admin = 1 WHERE id = 'user_admin_001';

-- Insert notification preferences for all users
INSERT INTO notification_prefs (user_id, updated_at) VALUES
('user_admin_001', strftime('%s', 'now')),
('user_driver_001', strftime('%s', 'now')),
('user_driver_002', strftime('%s', 'now')),
('user_passenger_001', strftime('%s', 'now'));

-- Insert test vehicles
INSERT INTO vehicles (id, user_id, make, model, year, color, license_plate, total_seats, is_verified, is_active, created_at, updated_at) VALUES
('vehicle_001', 'user_driver_001', 'پژو', '206', 2019, 'سفید', '۱۲ الف ۳۴۵ - ۶۷', 4, 1, 1, strftime('%s', 'now'), strftime('%s', 'now')),
('vehicle_002', 'user_driver_002', 'سمند', 'LX', 2020, 'نقره‌ای', '۲۳ ب ۴۵۶ - ۷۸', 4, 1, 1, strftime('%s', 'now'), strftime('%s', 'now'));

-- Insert test rides (future dates)
INSERT INTO rides (id, driver_id, vehicle_id, origin_city, origin_address, destination_city, destination_address, departure_time, price_per_seat, total_seats, available_seats, slug, status, created_at, updated_at) VALUES
('ride_001', 'user_driver_001', 'vehicle_001', 'تهران', 'میدان آزادی، تهران', 'اصفهان', 'میدان نقش جهان، اصفهان', strftime('%s', 'now') + 86400, 500000, 3, 3, 'tehran-to-isfahan-001', 'active', strftime('%s', 'now'), strftime('%s', 'now')),
('ride_002', 'user_driver_002', 'vehicle_002', 'تهران', 'ترمینال جنوب، تهران', 'شیراز', 'میدان ولیعصر، شیراز', strftime('%s', 'now') + 172800, 800000, 3, 2, 'tehran-to-shiraz-002', 'active', strftime('%s', 'now'), strftime('%s', 'now'));

-- Insert a test booking
INSERT INTO bookings (id, ride_id, passenger_id, seats_booked, total_price, status, payment_method, created_at, updated_at) VALUES
('booking_001', 'ride_002', 'user_passenger_001', 1, 800000, 'CONFIRMED', 'CASH', strftime('%s', 'now'), strftime('%s', 'now'));

-- Update available seats
UPDATE rides SET available_seats = 1 WHERE id = 'ride_002';

-- Insert test follow relationship
INSERT INTO follows (id, follower_id, followed_id, created_at) VALUES
('follow_001', 'user_passenger_001', 'user_driver_001', strftime('%s', 'now'));

-- Insert test favorite driver
INSERT INTO favorite_drivers (id, passenger_id, driver_id, created_at) VALUES
('fav_001', 'user_passenger_001', 'user_driver_001', strftime('%s', 'now'));

-- Insert test message
INSERT INTO messages (id, conversation_id, sender_id, receiver_id, content, created_at) VALUES
('msg_001', 'conv_passenger_001_driver_002', 'user_passenger_001', 'user_driver_002', 'سلام، ساعت حرکت دقیقا چه موقع هست؟', strftime('%s', 'now'));

-- Insert test rating
INSERT INTO ratings (id, booking_id, reviewer_id, reviewed_id, stars, review_text, created_at) VALUES
('rating_001', 'booking_001', 'user_passenger_001', 'user_driver_002', 5, 'راننده بسیار خوب و مودبی بود. توصیه می‌کنم.', strftime('%s', 'now'));

SELECT 'Seed data inserted successfully!' as message;

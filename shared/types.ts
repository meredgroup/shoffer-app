/**
 * Shared TypeScript types for Shoffer
 * Used across frontend, backend, and Durable Objects
 */

// ============================================
// USER & AUTH TYPES
// ============================================

export interface User {
    id: string;
    email?: string;
    email_verified: boolean;
    phone?: string;
    phone_verified: boolean;
    google_id?: string;
    full_name: string;
    avatar_url?: string;
    bio?: string;
    rating: number;
    total_ratings: number;
    is_driver: boolean;
    is_admin: boolean;
    status: 'active' | 'suspended' | 'banned';
    created_at: number;
    updated_at: number;
}

export interface AuthSession {
    user_id: string;
    token: string;
    expires_at: number;
}

export interface LoginRequest {
    email?: string;
    password?: string;
    phone?: string;
    otp?: string;
    google_token?: string;
}

export interface RegisterRequest {
    email?: string;
    password?: string;
    phone?: string;
    full_name: string;
    google_token?: string;
}

// ============================================
// VEHICLE TYPES
// ============================================

export interface Vehicle {
    id: string;
    user_id: string;
    make: string;
    model: string;
    year?: number;
    color?: string;
    license_plate: string;
    total_seats: number;
    is_verified: boolean;
    is_active: boolean;
    created_at: number;
    updated_at: number;
}

// ============================================
// RIDE TYPES
// ============================================

export interface Ride {
    id: string;
    driver_id: string;
    vehicle_id: string;

    origin_city: string;
    origin_address: string;
    origin_lat?: string;
    origin_lng?: string;

    destination_city: string;
    destination_address: string;
    destination_lat?: string;
    destination_lng?: string;

    departure_time: number;
    estimated_duration?: number;

    price_per_seat: number;
    total_seats: number;
    available_seats: number;

    women_only: boolean;
    pets_allowed: boolean;
    smoking_allowed: boolean;

    notes?: string;
    status: 'active' | 'full' | 'cancelled' | 'completed';
    slug: string;

    created_at: number;
    updated_at: number;

    // Populated fields (joins)
    driver?: User;
    vehicle?: Vehicle;
}

export interface RideSearchParams {
    origin_city?: string;
    destination_city?: string;
    departure_date_start?: number;
    departure_date_end?: number;
    min_seats?: number;
    max_price?: number;
    women_only?: boolean;
    pets_allowed?: boolean;
}

export interface CreateRideRequest {
    vehicle_id: string;
    origin_city: string;
    origin_address: string;
    origin_lat?: string;
    origin_lng?: string;
    destination_city: string;
    destination_address: string;
    destination_lat?: string;
    destination_lng?: string;
    departure_time: number;
    price_per_seat: number;
    total_seats: number;
    women_only?: boolean;
    pets_allowed?: boolean;
    smoking_allowed?: boolean;
    notes?: string;
}

// ============================================
// BOOKING TYPES
// ============================================

export interface Booking {
    id: string;
    ride_id: string;
    passenger_id: string;
    seats_booked: number;
    total_price: number;
    status: 'REQUESTED' | 'CONFIRMED' | 'CANCELLED' | 'COMPLETED';
    payment_method: 'CASH' | 'ONLINE';
    payment_status: 'PENDING' | 'PAID' | 'REFUNDED';
    idempotency_key?: string;
    created_at: number;
    updated_at: number;
    confirmed_at?: number;
    cancelled_at?: number;
    completed_at?: number;

    // Populated
    ride?: Ride;
    passenger?: User;
}

export interface CreateBookingRequest {
    ride_id: string;
    seats_booked: number;
    payment_method: 'CASH' | 'ONLINE';
    idempotency_key?: string;
}

// ============================================
// CHAT TYPES
// ============================================

export interface Message {
    id: string;
    conversation_id: string;
    sender_id: string;
    receiver_id: string;
    content: string;
    content_type: 'text' | 'image' | 'location';
    is_read: boolean;
    read_at?: number;
    created_at: number;

    // Populated
    sender?: User;
}

export interface Conversation {
    id: string;
    participants: [string, string]; // user IDs
    last_message?: Message;
    unread_count: number;
    updated_at: number;
}

export interface SendMessageRequest {
    receiver_id: string;
    content: string;
    content_type?: 'text' | 'image' | 'location';
}

// WebSocket message types
export interface WSMessage {
    type: 'message' | 'typing' | 'read' | 'presence';
    data: any;
    timestamp: number;
}

// ============================================
// RATING TYPES
// ============================================

export interface Rating {
    id: string;
    booking_id: string;
    reviewer_id: string;
    reviewed_id: string;
    stars: number;
    review_text?: string;
    created_at: number;

    // Populated
    reviewer?: User;
}

export interface CreateRatingRequest {
    booking_id: string;
    stars: number;
    review_text?: string;
}

// ============================================
// FOLLOW & FAVORITE TYPES
// ============================================

export interface Follow {
    id: string;
    follower_id: string;
    followed_id: string;
    created_at: number;
}

export interface FavoriteDriver {
    id: string;
    passenger_id: string;
    driver_id: string;
    created_at: number;

    // Populated
    driver?: User;
}

// ============================================
// TRIP REQUEST TYPES
// ============================================

export interface TripRequest {
    id: string;
    passenger_id: string;
    origin_city: string;
    origin_address?: string;
    destination_city: string;
    destination_address?: string;
    requested_departure_start: number;
    requested_departure_end?: number;
    seats_needed: number;
    max_price_per_seat?: number;
    notes?: string;
    notify_favorites: boolean;
    status: 'active' | 'fulfilled' | 'cancelled' | 'expired';
    created_at: number;
    updated_at: number;
    expires_at?: number;

    // Populated
    passenger?: User;
    recipients?: TripRequestRecipient[];
}

export interface TripRequestRecipient {
    id: string;
    trip_request_id: string;
    driver_id: string;
    status: 'sent' | 'viewed' | 'responded' | 'muted';
    viewed_at?: number;
    responded_at?: number;
    is_muted: boolean;
    created_at: number;
}

export interface CreateTripRequestRequest {
    origin_city: string;
    origin_address?: string;
    destination_city: string;
    destination_address?: string;
    requested_departure_start: number;
    requested_departure_end?: number;
    seats_needed: number;
    max_price_per_seat?: number;
    notes?: string;
    notify_favorites?: boolean;
}

// ============================================
// NOTIFICATION TYPES
// ============================================

export interface NotificationPreferences {
    user_id: string;
    enable_new_rides_from_followed: boolean;
    enable_trip_requests: boolean;
    enable_chat_notifications: boolean;
    enable_booking_notifications: boolean;
    enable_ride_reminders: boolean;
    updated_at: number;
}

export interface PushSubscription {
    id: string;
    user_id: string;
    endpoint: string;
    p256dh: string;
    auth: string;
    user_agent?: string;
    created_at: number;
    last_used_at: number;
}

export interface NotificationLog {
    id: string;
    user_id: string;
    type: 'new_ride' | 'trip_request' | 'chat' | 'booking' | 'reminder';
    title: string;
    body?: string;
    data?: string; // JSON
    sent_at: number;
    delivered: boolean;
    read: boolean;
}

// ============================================
// REPORT & SAFETY TYPES
// ============================================

export interface Report {
    id: string;
    reporter_id: string;
    reported_user_id?: string;
    reported_ride_id?: string;
    reason: string;
    description?: string;
    status: 'pending' | 'reviewed' | 'resolved' | 'dismissed';
    admin_notes?: string;
    resolved_by?: string;
    resolved_at?: number;
    created_at: number;
}

export interface Block {
    id: string;
    blocker_id: string;
    blocked_id: string;
    reason?: string;
    created_at: number;
}

// ============================================
// APP CONFIG TYPES
// ============================================

export interface AppConfig {
    key: string;
    value: string;
    value_type: 'string' | 'boolean' | 'number' | 'json';
    description?: string;
    updated_at: number;
    updated_by?: string;
}

export interface FeatureFlags {
    enable_phone_login: boolean;
    require_phone_verification_for_booking: boolean;
    max_trip_requests_per_day: number;
    map_provider: 'neshan' | 'balad' | 'list';
}

// ============================================
// ADMIN TYPES
// ============================================

export interface AdminAuditLog {
    id: string;
    admin_id: string;
    action: string;
    target_type?: string;
    target_id?: string;
    details?: string; // JSON
    created_at: number;
}

// ============================================
// API RESPONSE TYPES
// ============================================

export interface ApiResponse<T = any> {
    success: boolean;
    data?: T;
    error?: string;
    message?: string;
}

export interface PaginatedResponse<T> {
    items: T[];
    total: number;
    page: number;
    per_page: number;
    has_more: boolean;
}

// ============================================
// PERSIAN/JALALI DATE TYPES
// ============================================

export interface JalaliDate {
    year: number;
    month: number;
    day: number;
    formatted: string; // e.g., "۱۴۰۳/۰۹/۲۲"
}

// ============================================
// SEO TYPES
// ============================================

export interface SeoMetadata {
    title: string;
    description: string;
    keywords?: string[];
    og_image?: string;
    canonical_url?: string;
    schema_org?: any; // JSON-LD
}

// ============================================
// RATE LIMITING TYPES
// ============================================

export interface RateLimit {
    id: string;
    key: string;
    count: number;
    window_start: number;
    expires_at: number;
}

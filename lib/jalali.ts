/**
 * Jalali (Shamsi) Calendar Utilities
 * Using Iran's official calendar system
 */

import { format as formatJalali, parse as parseJalali } from 'date-fns-jalali';

/**
 * Format a timestamp to Jalali date string
 */
export function formatJalaliDate(timestamp: number, formatStr: string = 'yyyy/MM/dd'): string {
    const date = new Date(timestamp * 1000);
    return formatJalali(date, formatStr);
}

/**
 * Format a timestamp to Jalali date and time
 */
export function formatJalaliDateTime(timestamp: number): string {
    const date = new Date(timestamp * 1000);
    return formatJalali(date, 'yyyy/MM/dd - HH:mm');
}

/**
 * Format with full Persian month name
 */
export function formatJalaliLong(timestamp: number): string {
    const date = new Date(timestamp * 1000);
    return formatJalali(date, 'd MMMM yyyy');
}

/**
 * Format time only
 */
export function formatTime(timestamp: number): string {
    const date = new Date(timestamp * 1000);
    return formatJalali(date, 'HH:mm');
}

/**
 * Get relative time in Persian
 */
export function getRelativeTime(timestamp: number): string {
    const now = Date.now();
    const diff = now - (timestamp * 1000);
    const seconds = Math.floor(diff / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    if (seconds < 60) {
        return 'الان';
    } else if (minutes < 60) {
        return `${toPersianNumber(minutes)} دقیقه پیش`;
    } else if (hours < 24) {
        return `${toPersianNumber(hours)} ساعت پیش`;
    } else if (days < 7) {
        return `${toPersianNumber(days)} روز پیش`;
    } else {
        return formatJalaliDate(timestamp, 'd MMMM');
    }
}

/**
 * Convert Gregorian date input to Jalali for display
 */
export function gregorianToJalali(gregorianDate: string): string {
    const date = new Date(gregorianDate);
    return formatJalali(date, 'yyyy/MM/dd');
}

/**
 * Convert Jalali date string to timestamp
 */
export function jalaliToTimestamp(jalaliDateStr: string): number {
    try {
        const date = parseJalali(jalaliDateStr, 'yyyy/MM/dd', new Date());
        return Math.floor(date.getTime() / 1000);
    } catch {
        return Math.floor(Date.now() / 1000);
    }
}

/**
 * Convert numbers to Persian digits
 */
export function toPersianNumber(num: number | string): string {
    const persianDigits = ['۰', '۱', '۲', '۳', '۴', '۵', '۶', '۷', '۸', '۹'];
    return String(num).replace(/\d/g, (digit) => persianDigits[parseInt(digit)]);
}

/**
 * Format price with Persian numbers and separators
 */
export function formatPrice(price: number): string {
    const formatted = new Intl.NumberFormat('fa-IR').format(price);
    return toPersianNumber(formatted);
}

/**
 * Get Jalali date for input field (uses Gregorian behind the scenes for compatibility)
 */
export function getJalaliInputDate(timestamp?: number): string {
    const date = timestamp ? new Date(timestamp * 1000) : new Date();
    // Return ISO format for input[type="date"] compatibility
    return date.toISOString().split('T')[0];
}

/**
 * Get current Jalali date string
 */
export function getCurrentJalaliDate(): string {
    return formatJalaliDate(Math.floor(Date.now() / 1000));
}

/**
 * Jalali month names
 */
export const JALALI_MONTHS = [
    'فروردین',
    'اردیبهشت',
    'خرداد',
    'تیر',
    'مرداد',
    'شهریور',
    'مهر',
    'آبان',
    'آذر',
    'دی',
    'بهمن',
    'اسفند',
];

/**
 * Jalali weekday names
 */
export const JALALI_WEEKDAYS = [
    'یکشنبه',
    'دوشنبه',
    'سه‌شنبه',
    'چهارشنبه',
    'پنج‌شنبه',
    'جمعه',
    'شنبه',
];

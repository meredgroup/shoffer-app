# 🗓️ Jalali Calendar Reference Guide

Complete guide for using Iran's official Jalali (Shamsi/Solar Hijri) calendar in Shoffer.

---

## 📚 **Import**

```typescript
import {
    formatJalaliDate,
    formatJalaliDateTime,
    formatJalaliLong,
    formatTime,
    getRelativeTime,
    toPersianNumber,
    formatPrice,
    getCurrentJalaliDate,
    JALALI_MONTHS,
    JALALI_WEEKDAYS,
} from '@/lib/jalali';
```

---

## 🔧 **Core Functions**

### **1. Date Formatting**

```typescript
// Basic date (short format)
formatJalaliDate(timestamp)
// Output: "۱۴۰۳/۰۹/۲۲"

// Date + time
formatJalaliDateTime(timestamp)
// Output: "۱۴۰۳/۰۹/۲۲ - ۱۴:۳۰"

// Long format with month name
formatJalaliLong(timestamp)
// Output: "۲۲ آذر ۱۴۰۳"

// Time only
formatTime(timestamp)
// Output: "۱۴:۳۰"
```

### **2. Relative Time (Persian)**

```typescript
getRelativeTime(timestamp)

// Examples:
// < 1 min:  "الان"
// 5 mins:   "۵ دقیقه پیش"  
// 2 hours:  "۲ ساعت پیش"
// 3 days:   "۳ روز پیش"
// > 7 days: "۲۲ آذر"
```

### **3. Number Conversion**

```typescript
// Convert to Persian digits
toPersianNumber(1234)
// Output: "۱۲۳۴"

toPersianNumber("2025")
// Output: "۲۰۲۵"
```

### **4. Price Formatting**

```typescript
// Format with separators + Persian digits
formatPrice(1500000)
// Output: "۱٬۵۰۰٬۰۰۰"

formatPrice(500)
// Output: "۵۰۰"
```

---

## 📅 **Calendar Constants**

### **Month Names**

```typescript
JALALI_MONTHS = [
    'فروردین',   // 1
    'اردیبهشت',  // 2
    'خرداد',     // 3
    'تیر',       // 4
    'مرداد',     // 5
    'شهریور',    // 6
    'مهر',       // 7
    'آبان',      // 8
    'آذر',       // 9
    'دی',        // 10
    'بهمن',      // 11
    'اسفند'      // 12
];
```

### **Weekday Names**

```typescript
JALALI_WEEKDAYS = [
    'یکشنبه',    // Sunday
    'دوشنبه',    // Monday
    'سه‌شنبه',   // Tuesday
    'چهارشنبه',  // Wednesday
    'پنج‌شنبه',  // Thursday
    'جمعه',      // Friday
    'شنبه'       // Saturday
];
```

---

## 💡 **Usage Examples**

### **Example 1: Display Ride Date**

```tsx
interface Ride {
    departure_time: number; // Unix timestamp
}

function RideCard({ ride }: { ride: Ride }) {
    return (
        <div>
            <h3>زمان حرکت</h3>
            <p>{formatJalaliDateTime(ride.departure_time)}</p>
            {/* Output: "۱۴۰۳/۰۹/۲۲ - ۱۴:۳۰" */}
        </div>
    );
}
```

### **Example 2: Show Price**

```tsx
function RidePrice({ price }: { price: number }) {
    return (
        <div>
            <span>{formatPrice(price)}</span>
            <span> تومان</span>
            {/* Output: "۱٬۵۰۰٬۰۰۰ تومان" */}
        </div>
    );
}
```

### **Example 3: Chat Timestamps**

```tsx
function MessageTime({ timestamp }: { timestamp: number }) {
    return (
        <span className="timestamp">
            {getRelativeTime(timestamp)}
            {/* Output: "۵ دقیقه پیش" */}
        </span>
    );
}
```

### **Example 4: Seat Count**

```tsx
function SeatInfo({ available, total }: { available: number; total: number }) {
    return (
        <p>
            {toPersianNumber(available)} صندلی از {toPersianNumber(total)}
            {/* Output: "۳ صندلی از ۵" */}
        </p>
    );
}
```

---

## 🎯 **Best Practices**

### **✅ DO:**

1. **Always use Jalali for display:**
   ```tsx
   // ✅ Good
   <p>{formatJalaliDate(ride.departure_time)}</p>
   
   // ❌ Bad
   <p>{new Date(ride.departure_time * 1000).toLocaleDateString()}</p>
   ```

2. **Convert all numbers:**
   ```tsx
   // ✅ Good
   <p>{toPersianNumber(count)} نفر</p>
   
   // ❌ Bad
   <p>{count} نفر</p>
   ```

3. **Use relative time for recent events:**
   ```tsx
   // ✅ Good for chat/notifications
   <span>{getRelativeTime(message.created_at)}</span>
   
   // ✅ Good for future events (rides)
   <span>{formatJalaliDateTime(ride.departure_time)}</span>
   ```

### **❌ DON'T:**

1. **Don't mix Gregorian and Jalali:**
   ```tsx
   // ❌ Bad - Inconsistent
   <p>تاریخ: {new Date().toLocaleDateString('fa-IR')}</p>
   <p>ساعت: {formatTime(timestamp)}</p>
   ```

2. **Don't use English numbers in Persian text:**
   ```tsx
   // ❌ Bad
   <p>قیمت: {price} تومان</p>
   
   // ✅ Good
   <p>قیمت: {formatPrice(price)} تومان</p>
   ```

---

## 📊 **Comparison: Before vs After**

### **Before (Manual Formatting):**
```tsx
const formatDate = (timestamp: number) => {
    const date = new Date(timestamp * 1000);
    return new Intl.DateTimeFormat('fa-IR', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
    }).format(date);
};

const formatPrice = (price: number) => {
    return new Intl.NumberFormat('fa-IR').format(price);
};
```

### **After (Jalali Utilities):**
```tsx
import { formatJalaliDateTime, formatPrice } from '@/lib/jalali';

// Just use it!
<p>{formatJalaliDateTime(timestamp)}</p>
<p>{formatPrice(price)} تومان</p>
```

**Benefits:**
- ✅ Consistent formatting across app
- ✅ Less code duplication
- ✅ Easier to maintain
- ✅ Better Persian support
- ✅ Built-in edge cases handling

---

## 🔄 **Input/Output Reference**

### **Timestamps to Display:**

| Function | Input | Output |
|----------|-------|--------|
| `formatJalaliDate()` | `1702389000` | `۱۴۰۳/۰۹/۲۲` |
| `formatJalaliDateTime()` | `1702389000` | `۱۴۰۳/۰۹/۲۲ - ۱۴:۳۰` |
| `formatJalaliLong()` | `1702389000` | `۲۲ آذر ۱۴۰۳` |
| `formatTime()` | `1702389000` | `۱۴:۳۰` |
| `getRelativeTime()` | `<1hr ago` | `۴۵ دقیقه پیش` |

### **Numbers to Persian:**

| Function | Input | Output |
|----------|-------|--------|
| `toPersianNumber()` | `123` | `۱۲۳` |
| `toPersianNumber()` | `"2025"` | `۲۰۲۵` |
| `formatPrice()` | `1500000` | `۱٬۵۰۰٬۰۰۰` |

---

## 🧪 **Testing**

```typescript
// Test in browser console:
import { formatJalaliDate, toPersianNumber } from '@/lib/jalali';

// Current date in Jalali
console.log(getCurrentJalaliDate());
// "۱۴۰۳/۰۹/۲۲"

// Convert number
console.log(toPersianNumber(1234567890));
// "۱۲۳۴۵۶۷۸۹۰"

// Format timestamp
const now = Math.floor(Date.now() / 1000);
console.log(formatJalaliDateTime(now));
// "۱۴۰۳/۰۹/۲۲ - ۱۴:۳۰"
```

---

## 📖 **Quick Reference Card**

```typescript
// Dates & Times
formatJalaliDate(ts)         // ۱۴۰۳/۰۹/۲۲
formatJalaliDateTime(ts)     // ۱۴۰۳/۰۹/۲۲ - ۱۴:۳۰
formatJalaliLong(ts)         // ۲۲ آذر ۱۴۰۳
formatTime(ts)               // ۱۴:۳۰
getRelativeTime(ts)          // ۵ دقیقه پیش

// Numbers & Prices
toPersianNumber(123)         // ۱۲۳
formatPrice(1500000)         // ۱٬۵۰۰٬۰۰۰

// Constants
JALALI_MONTHS[0]             // 'فروردین'
JALALI_WEEKDAYS[0]           // 'یکشنبه'

// Current
getCurrentJalaliDate()       // "۱۴۰۳/۰۹/۲۲"
```

---

## 🎨 **UI Patterns**

### **Pattern 1: Ride Card Date**
```tsx
<div className="ride-card">
    <div className="date-badge">
        {formatJalaliLong(ride.departure_time)}
    </div>
    <div className="time">
        ساعت {formatTime(ride.departure_time)}
    </div>
</div>
```

### **Pattern 2: Price Tag**
```tsx
<div className="price-tag">
    <span className="amount">{formatPrice(price)}</span>
    <span className="currency">تومان</span>
</div>
```

### **Pattern 3: Recent Activity**
```tsx
<div className="activity">
    <span className="time">{getRelativeTime(activity.created_at)}</span>
    <span className="action">{activity.text}</span>
</div>
```

---

## 🌟 **Advanced Tips**

### **1. Custom Date Format**
```typescript
import { format as formatJalali } from 'date-fns-jalali';

const customFormat = (timestamp: number) => {
    const date = new Date(timestamp * 1000);
    return formatJalali(date, 'yyyy/MM/dd - EEEE');
    // "۱۴۰۳/۰۹/۲۲ - پنج‌شنبه"
};
```

### **2. Date Range**
```typescript
const from = formatJalaliDate(ride.departure_time);
const to = formatJalaliDate(ride.arrival_time);
return `${from} تا ${to}`;
// "۱۴۰۳/۰۹/۲۲ تا ۱۴۰۳/۰۹/۲۳"
```

### **3. Conditional Formatting**
```typescript
const displayTime = (ts: number) => {
    const now = Math.floor(Date.now() / 1000);
    const diffDays = Math.floor((ts - now) / 86400);
    
    if (diffDays < 7) {
        return getRelativeTime(ts);
    } else {
        return formatJalaliLong(ts);
    }
};
```

---

## 📝 **Migration Checklist**

If updating old code to use Jalali:

- [ ] Replace all `new Intl.DateTimeFormat('fa-IR')` with `formatJalali*`
- [ ] Replace all `new Intl.NumberFormat('fa-IR')` with `toPersianNumber` or `formatPrice`
- [ ] Update timestamp displays to use `getRelativeTime` for recent events
- [ ] Convert all numeric displays with `toPersianNumber`
- [ ] Test all date/time displays visually
- [ ] Verify Persian digits appear correctly (۰-۹)

---

**📅 Iran's Official Calendar - Fully Integrated!**
